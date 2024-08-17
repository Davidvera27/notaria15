import fitz  # PyMuPDF
import re
import win32com.client as win32
import pythoncom  # Necesario para inicializar COM
import os
from flask import current_app, jsonify, request
from models import Case, Protocolist


def extract_pdf_data(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()

    clase = extract_field(text, "CLASE")
    radicado = extract_field(text, "RADICADO N°")
    doc_number = extract_field(text, "N° DOC")

    print(f"Extracted data from {pdf_path}: CLASE={clase}, RADICADO N°={radicado}, N° DOC={doc_number}")

    return {
        "CLASE": clase,
        "RADICADO N°": radicado,
        "N° DOC": doc_number
    }


def extract_field(text, field_name):
    pattern = rf"{field_name}\s*([\d\-]+)"
    match = re.search(pattern, text)
    if match:
        return match.group(1).strip()
    return "No encontrado"


def send_email_via_outlook(recipients, subject, body, attachments=None):
    try:
        # Inicializar COM en el hilo
        pythoncom.CoInitialize()

        # Crear instancia de Outlook
        outlook = win32.Dispatch("Outlook.Application")
        mail = outlook.CreateItem(0)

        # Configurar el correo
        mail.To = "; ".join(recipients)
        mail.Subject = subject
        mail.Body = body

        # Adjuntar archivos, si hay
        if attachments:
            for attachment in attachments:
                absolute_path = os.path.abspath(attachment)
                if os.path.exists(absolute_path):
                    print(f"Adjuntando archivo: {absolute_path}")  # Imprime la ruta del archivo
                    mail.Attachments.Add(absolute_path)
                else:
                    print(f"El archivo {absolute_path} no existe o la ruta es incorrecta.")

        # Enviar el correo
        mail.Send()
        print("Correo enviado exitosamente via Outlook")
    except Exception as e:
        print(f"Error al enviar correo via Outlook: {e}")
    finally:
        # Desinicializar COM después de la operación
        pythoncom.CoUninitialize()


def send_case_email():
    data = request.json
    radicado = data.get('radicado')

    case = Case.query.filter_by(radicado=radicado).first()

    if not case:
        return jsonify({'error': 'Case not found'}), 404

    protocolista = Protocolist.query.get(case.protocolista_id)
    if not protocolista:
        return jsonify({'error': 'Protocolist not found'}), 404

    pdf_path = None
    uploads_dir = current_app.config['UPLOAD_FOLDER']
    uploads_dir_abs = os.path.abspath(uploads_dir)

    # Buscar el archivo PDF que coincide con el número de radicado
    for filename in os.listdir(uploads_dir_abs):
        if filename.endswith('.pdf'):
            file_path = os.path.join(uploads_dir_abs, filename)
            pdf_data = extract_pdf_data(file_path)
            if pdf_data['RADICADO N°'] == radicado:
                pdf_path = file_path
                break

    if not pdf_path:
        return jsonify({'error': 'PDF not found in uploads'}), 404

    # Enviar el correo con el archivo adjunto
    subject = f"BOLETA DE RENTAS {radicado}"
    body = f"Señor(a) {protocolista.nombre},\n\nAdjunto encontrará el documento Liquidación De Impuesto De Registro, correspondiente al radicado No. {radicado} de la escritura {case.escritura}.\n\nAtentamente,\nAuxiliar de rentas Notaría 15."

    send_email_via_outlook(recipients=[protocolista.correo_electronico], 
                           subject=subject, 
                           body=body, 
                           attachments=[pdf_path])

    return jsonify({'message': 'Email sent successfully'})
