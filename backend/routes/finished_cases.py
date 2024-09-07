from flask import Blueprint, jsonify, request
from models import CaseFinished, db

finished_cases_bp = Blueprint('finished_cases_bp', __name__)

# Obtener todos los casos finalizados
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
            'fecha_documento': case.fecha_documento,
            'envios': case.envios
        } for case in cases
    ]
    return jsonify(result)

# Eliminar un caso finalizado
@finished_cases_bp.route('/finished_cases/<int:id>', methods=['DELETE'])
def delete_finished_case(id):
    case = CaseFinished.query.get_or_404(id)
    db.session.delete(case)
    db.session.commit()
    return jsonify({'message': 'Caso eliminado con éxito'})

# Editar un caso finalizado
@finished_cases_bp.route('/finished_cases/<int:id>', methods=['PUT'])
def update_finished_case(id):
    case = CaseFinished.query.get_or_404(id)
    data = request.get_json()

    case.fecha = data.get('fecha', case.fecha)
    case.escritura = data.get('escritura', case.escritura)
    case.radicado = data.get('radicado', case.radicado)
    case.protocolista = data.get('protocolista', case.protocolista)
    case.observaciones = data.get('observaciones', case.observaciones)
    case.fecha_documento = data.get('fecha_documento', case.fecha_documento)
    case.envios = data.get('envios', case.envios)

    db.session.commit()
    return jsonify({'message': 'Caso actualizado con éxito'})
