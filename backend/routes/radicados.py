from flask import Blueprint, jsonify, request
from models import Radicado, Case, db

radicados_bp = Blueprint('radicados', __name__)

@radicados_bp.route('/cases/<int:case_id>/radicados', methods=['GET'])
def get_radicados(case_id):
    radicados = Radicado.query.filter_by(case_id=case_id).all()
    return jsonify([radicado.to_dict() for radicado in radicados])

@radicados_bp.route('/cases/<int:case_id>/radicados', methods=['POST'])
def add_radicado(case_id):
    data = request.json
    new_radicado = Radicado(case_id=case_id, radicado=data['radicado'])
    db.session.add(new_radicado)
    
    # Actualizar el radicado en la tabla 'case'
    case = Case.query.get(case_id)
    if case:
        case.radicado = data['radicado']
    
    db.session.commit()
    return jsonify(new_radicado.to_dict())
