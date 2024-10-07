from flask import Blueprint, jsonify, request
import os
from utils import extract_pdf_data
from models import InfoEscritura, db
from config import Config

extract_data_bp = Blueprint('extract_data', __name__)

# Ruta para procesar los archivos PDF en la carpeta "uploads"
@extract_data_bp.route('/extract-data', methods=['GET'])
def extract_data():
    pdf_files = [f for f in os.listdir(Config.UPLOAD_FOLDER) if f.endswith('.pdf')]
    extracted_data = []
    
    # Procesar cada archivo PDF
    for pdf_file in pdf_files:
        pdf_path = os.path.join(Config.UPLOAD_FOLDER, pdf_file)
        data = extract_pdf_data(pdf_path)
        
        # Almacenar los datos extraídos en una lista
        extracted_data.append({
            "filename": pdf_file,
            "data": data
        })

        # Si se encuentra el radicado y la fecha de vigencia, actualizar la tabla "info_escritura"
        if 'RADICADO N°' in data and 'FECHA_LIMITE_REGISTRO' in data:
            info_escritura = InfoEscritura.query.filter_by(radicado=data['RADICADO N°']).first()
            if info_escritura:
                info_escritura.vigencia_rentas = data['FECHA_LIMITE_REGISTRO']
                if data['TOTAL_PAGADO'] is not None:  # Asegurarse de que el total pagado sea válido
                    info_escritura.total_pagado = data['TOTAL_PAGADO']
                db.session.commit()

    # Retornar los datos extraídos
    return jsonify(extracted_data)

# Ruta para procesar un archivo PDF específico que se envía mediante POST
@extract_data_bp.route('/extract-data', methods=['POST'])
def extract_data_from_file():
    file_path = request.json.get('file_path')

    if not file_path or not file_path.endswith('.pdf'):
        return jsonify({'error': 'Archivo no válido'}), 400

    # Extraer los datos del PDF utilizando la función de utilidades
    data = extract_pdf_data(file_path)

    # Si se encuentra el radicado y la fecha de vigencia, actualizar la tabla "info_escritura"
    if 'RADICADO N°' in data and 'FECHA_LIMITE_REGISTRO' in data:
        info_escritura = InfoEscritura.query.filter_by(radicado=data['RADICADO N°']).first()
        if info_escritura:
            info_escritura.vigencia_rentas = data['FECHA_LIMITE_REGISTRO']
            if data['TOTAL_PAGADO'] is not None:  # Asegurarse de que el total pagado sea válido
                info_escritura.total_pagado = data['TOTAL_PAGADO']
            db.session.commit()

    # Retornar los datos extraídos
    return jsonify({
        "filename": os.path.basename(file_path),
        "data": data
    })
