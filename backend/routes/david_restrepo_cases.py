from flask import Blueprint, jsonify, request
from models import DavidRestrepoCase, db, Case

david_restrepo_cases_bp = Blueprint('david_restrepo_cases', __name__)

@david_restrepo_cases_bp.route('/david_restrepo_cases', methods=['POST'])
def create_case():
    data = request.json
    case = DavidRestrepoCase(
        protocolista_id=data['protocolista_id'],
        escritura=data['escritura'],
        fecha_escritura=data['fecha_escritura'],
        actos=data['actos'],
        estado_liquidacion_rentas=data.get('estado_liquidacion_rentas', '')
    )

    # Buscar el radicado relacionado en la tabla 'case'
    related_case = Case.query.filter_by(escritura=case.escritura).first()
    if related_case:
        case.radicado = related_case.radicado

    db.session.add(case)
    db.session.commit()
    return jsonify(case.to_dict()), 201

@david_restrepo_cases_bp.route('/david_restrepo_cases/<int:protocolista_id>', methods=['GET'])
def get_cases_by_protocolista(protocolista_id):
    cases = DavidRestrepoCase.query.filter_by(protocolista_id=protocolista_id).all()
    return jsonify([case.to_dict() for case in cases]), 200
