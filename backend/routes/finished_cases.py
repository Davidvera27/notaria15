from flask import Blueprint, jsonify
from models import CaseFinished  # Asegúrate de que el modelo esté correctamente definido

finished_cases_bp = Blueprint('finished_cases_bp', __name__)

@finished_cases_bp.route('/finished_cases', methods=['GET'])
def get_finished_cases():
    cases = CaseFinished.query.all()
    result = [
        {
            'id': case.id,
            'fecha': case.fecha,
            'escritura': case.escritura,
            'radicado': case.radicado,
            'protocolista': case.protocolista,
            'observaciones': case.observaciones,
            'fecha_documento': case.fecha_documento,  # Incluir el nuevo campo
            'envios': case.envios  # Enviar el número de envíos
        } for case in cases
    ]
    return jsonify(result)
