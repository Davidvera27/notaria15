from flask import Blueprint, jsonify, request, current_app as app
from models import Case, Radicado, Protocolist, db
from utils import send_email_via_outlook, extract_pdf_data
import os
from flask import current_app

cases_bp = Blueprint('cases', __name__)

@cases_bp.route('/cases', methods=['GET'])
def get_cases():
    cases = Case.query.all()
    result = []
    for case in cases:
        last_radicado = Radicado.query.filter_by(case_id=case.id).order_by(Radicado.fecha.desc()).first()
        case_data = case.to_dict()
        if last_radicado:
            case_data['radicado'] = last_radicado.radicado
        result.append(case_data)
    return jsonify(result)

@cases_bp.route('/cases', methods=['POST'])
def add_case():
    data = request.json

    if not data.get('fecha') or not data.get('escritura') or not data.get('radicado') or not data.get('protocolista'):
        return jsonify({'error': 'Todos los campos son obligatorios'}), 400

    try:
        protocolista = Protocolist.query.filter_by(nombre=data['protocolista']).first()
        if not protocolista:
            return jsonify({'error': 'Protocolista no encontrado'}), 400

        new_case = Case(
            fecha=data['fecha'],
            escritura=int(data['escritura']),
            radicado=data['radicado'],
            protocolista_id=protocolista.id,
            observaciones=data.get('observaciones', '')
        )
        db.session.add(new_case)
        db.session.commit()
        return jsonify(new_case.to_dict())
    except Exception as e:
        db.session.rollback()
        print(f"Error al crear el caso: {e}")
        return jsonify({'error': 'Hubo un problema al crear el caso.'}), 500

@cases_bp.route('/send_email', methods=['POST'])
def send_case_email():
    data = request.json
    radicado = data.get('radicado')

    case = Case.query.filter_by(radicado=radicado).first()

    if not case:
        return jsonify({'error': 'Case not found'}), 404

    protocolista = Protocolist.query.get(case.protocolista_id)
    if not protocolista:
        return jsonify({'error': 'Protocolist not found'}), 404

    # Buscar el archivo PDF
    pdf_path = None
    uploads_dir = current_app.config['UPLOAD_FOLDER']
    for filename in os.listdir(uploads_dir):
        if filename.endswith('.pdf'):
            file_path = os.path.join(uploads_dir, filename)
            pdf_data = extract_pdf_data(file_path)
            if pdf_data['RADICADO N°'] == radicado:
                pdf_path = file_path
                break

    if not pdf_path:
        return jsonify({'error': 'PDF not found in uploads'}), 404

    subject = f"BOLETA DE RENTAS {radicado}"
    body = f"Señor(a) {protocolista.nombre},\n\nAdjunto encontrará el documento Liquidación De Impuesto De Registro, correspondiente al radicado No. {radicado} de la escritura {case.escritura}.\n\nAtentamente,\nAuxiliar de rentas Notaría 15."

    # Usar send_email_via_outlook para enviar el correo
    send_email_via_outlook(recipients=[protocolista.correo_electronico], 
                           subject=subject, 
                           body=body, 
                           attachments=[pdf_path])

    return jsonify({'message': 'Email sent successfully'})


@cases_bp.route('/cases/<int:id>', methods=['PUT'])
def update_case(id):
    data = request.json
    case = Case.query.get(id)
    if not case:
        return jsonify({'error': 'Case not found'}), 404

    protocolista = Protocolist.query.filter_by(nombre=data.get('protocolista')).first()
    if not protocolista:
        return jsonify({'error': 'Protocolista no encontrado'}), 400

    case.fecha = data.get('fecha', case.fecha)
    case.escritura = data.get('escritura', case.escritura)
    case.radicado = data.get('radicado', case.radicado)
    case.protocolista_id = protocolista.id
    case.observaciones = data.get('observaciones', case.observaciones)

    db.session.commit()
    return jsonify(case.to_dict())

@cases_bp.route('/cases/<int:id>', methods=['DELETE'])
def delete_case(id):
    case = Case.query.get(id)
    if not case:
        return jsonify({'error': 'Case not found'}), 404

    db.session.delete(case)
    db.session.commit()
    return '', 204

@cases_bp.route('/cases/<int:case_id>/radicados', methods=['GET'])
def get_radicados(case_id):
    radicados = Radicado.query.filter_by(case_id=case_id).all()
    return jsonify([radicado.to_dict() for radicado in radicados])

@cases_bp.route('/cases/<int:case_id>/radicados', methods=['POST'])
def add_radicado(case_id):
    data = request.json
    new_radicado = Radicado(case_id=case_id, radicado=data['radicado'])
    db.session.add(new_radicado)
    db.session.commit()
    return jsonify(new_radicado.to_dict())
