import fitz  # PyMuPDF
import re
import win32com.client as win32
import pythoncom  # Necesario para inicializar COM
import os
from flask import current_app, jsonify, request
from models import Case, Protocolist

# Función para extraer datos del PDF, incluyendo la Fecha Límite de Registro
def extract_pdf_data(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()

    # Extraer campos existentes
    clase = extract_field(text, "CLASE")
    radicado = extract_field(text, "RADICADO N°")
    doc_number = extract_field(text, "N° DOC")
    fecha_limite_registro = extract_fecha_limite(text)
    
    # Extraer nuevo dato: Total Pagado
    total_pagado = extract_total_pagado(text)

    print(f"Extracted data from {pdf_path}: CLASE={clase}, RADICADO N°={radicado}, N° DOC={doc_number}, FECHA_LIMITE_REGISTRO={fecha_limite_registro}, TOTAL_PAGADO={total_pagado}")

    return {
        "CLASE": clase,
        "RADICADO N°": radicado,
        "N° DOC": doc_number,
        "FECHA_LIMITE_REGISTRO": fecha_limite_registro,
        "TOTAL_PAGADO": total_pagado  # Incluir el nuevo dato extraído
    }

# Función auxiliar para extraer campos como CLASE, RADICADO, N° DOC
def extract_field(text, field_name):
    pattern = rf"{field_name}\s*([\d\-]+)"
    match = re.search(pattern, text)
    if match:
        return match.group(1).strip()
    return "No encontrado"

# Nueva función auxiliar para extraer el "Total Pagado"
def extract_total_pagado(text):
    pattern = r'Total\s+Pagado\s+COP\s*\$\s*([\d\.,]+)'
    match = re.search(pattern, text)
    if match:
        total_str = match.group(1).replace('.', '').replace(',', '.')
        try:
            return float(total_str)
        except ValueError:
            return None  # Manejar valores que no se puedan convertir
    return None

# Nueva función auxiliar para extraer la "Fecha Límite de Registro"
def extract_fecha_limite(text):
    pattern = r'FECHA L[IÍ]MITE\s+DE\s+REGISTRO\s+(\d{2}\.\d{2}\.\d{4})'
    match = re.search(pattern, text)
    if match:
        return match.group(1)
    return "No encontrado"

# Función para enviar correos electrónicos utilizando Outlook
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
                    print(f"Adjuntando archivo: {absolute_path}")
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

# Función para enviar el correo electrónico de un caso en específico
def send_case_email():
    data = request.json
    radicado = data.get('radicado')

    # Verificar si el caso existe en la base de datos
    case = Case.query.filter_by(radicado=radicado).first()

    if not case:
        return jsonify({'error': 'Case not found'}), 404

    # Verificar si el protocolista existe
    protocolista = Protocolist.query.get(case.protocolista_id)
    if not protocolista:
        return jsonify({'error': 'Protocolist not found'}), 404

    # Buscar el archivo PDF asociado al radicado
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
