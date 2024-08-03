from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
import fitz  # PyMuPDF
import re

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configurar la base de datos
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database', 'notaria15.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Case(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.String(50))
    escritura = db.Column(db.Integer)
    radicado = db.Column(db.String(50))
    protocolista = db.Column(db.String(50))

    def to_dict(self):
        return {
            'id': self.id,
            'fecha': self.fecha,
            'escritura': self.escritura,
            'radicado': self.radicado,
            'protocolista': self.protocolista
        }

class Protocolist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50))
    correo_electronico = db.Column(db.String(50))

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'correo_electronico': self.correo_electronico
        }

@app.route('/api/cases', methods=['GET'])
def get_cases():
    cases = Case.query.all()
    return jsonify([case.to_dict() for case in cases])

@app.route('/api/cases', methods=['POST'])
def add_case():
    data = request.json
    new_case = Case(fecha=data['fecha'], escritura=data['escritura'], radicado=data['radicado'], protocolista=data['protocolista'])
    db.session.add(new_case)
    db.session.commit()
    return jsonify(new_case.to_dict()), 201

@app.route('/api/cases/<int:id>', methods=['PUT'])
def update_case(id):
    data = request.json
    case = Case.query.get(id)
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    case.fecha = data['fecha']
    case.escritura = data['escritura']
    case.radicado = data['radicado']
    case.protocolista = data['protocolista']
    db.session.commit()
    return jsonify(case.to_dict())

@app.route('/api/cases/<int:id>', methods=['DELETE'])
def delete_case(id):
    case = Case.query.get(id)
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    db.session.delete(case)
    db.session.commit()
    return '', 204

@app.route('/api/protocolists', methods=['GET'])
def get_protocolists():
    protocolists = Protocolist.query.all()
    return jsonify([protocolist.to_dict() for protocolist in protocolists])

@app.route('/api/protocolists', methods=['POST'])
def add_protocolist():
    data = request.json
    new_protocolist = Protocolist(nombre=data['nombre'], correo_electronico=data['correo_electronico'])
    db.session.add(new_protocolist)
    db.session.commit()
    return jsonify(new_protocolist.to_dict()), 201

@app.route('/api/protocolists/<int:id>', methods=['PUT'])
def update_protocolist(id):
    protocolist = Protocolist.query.get_or_404(id)
    data = request.json
    protocolist.nombre = data['nombre']
    protocolist.correo_electronico = data['correo_electronico']
    db.session.commit()
    return jsonify(protocolist.to_dict())

@app.route('/api/protocolists/<int:id>', methods=['DELETE'])
def delete_protocolist(id):
    protocolist = Protocolist.query.get_or_404(id)
    db.session.delete(protocolist)
    db.session.commit()
    return jsonify({'message': 'Protocolist deleted successfully'})

# Nueva funcionalidad para extraer datos de PDFs
def extract_pdf_data(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()

    # Extraer los datos específicos
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

@app.route('/api/extract-data', methods=['GET'])
def extract_data():
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    pdf_files = [f for f in os.listdir(UPLOAD_FOLDER) if f.endswith('.pdf')]
    extracted_data = []
    for pdf_file in pdf_files:
        pdf_path = os.path.join(UPLOAD_FOLDER, pdf_file)
        data = extract_pdf_data(pdf_path)
        extracted_data.append({
            "filename": pdf_file,
            "data": data
        })

    return jsonify(extracted_data)

if __name__ == '__main__':
    app.run(debug=True)
