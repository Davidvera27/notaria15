from flask import Blueprint, jsonify
import os
from utils import extract_pdf_data
from config import Config

extract_data_bp = Blueprint('extract_data', __name__)

@extract_data_bp.route('/extract-data', methods=['GET'])
def extract_data():
    pdf_files = [f for f in os.listdir(Config.UPLOAD_FOLDER) if f.endswith('.pdf')]
    extracted_data = []
    for pdf_file in pdf_files:
        pdf_path = os.path.join(Config.UPLOAD_FOLDER, pdf_file)
        data = extract_pdf_data(pdf_path)
        extracted_data.append({
            "filename": pdf_file,
            "data": data
        })

    return jsonify(extracted_data)
