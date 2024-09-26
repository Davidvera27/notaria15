from flask import Blueprint, jsonify, request
from models import CaseFinished, Case, Protocolist, db

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

# Retornar un caso a la tabla de casos pendientes
@finished_cases_bp.route('/finished_cases/return/<int:id>', methods=['POST'])
def return_case_to_pending(id):
    case_finished = CaseFinished.query.get_or_404(id)

    # Verificar si el caso ya existe en la tabla `case`
    existing_case = Case.query.filter_by(radicado=case_finished.radicado).first()
    if existing_case:
        return jsonify({'error': 'El caso ya se encuentra en la tabla de casos pendientes.'}), 400

    # Obtener el protocolista para obtener el ID
    protocolista = Protocolist.query.filter_by(nombre=case_finished.protocolista).first()
    if not protocolista:
        return jsonify({'error': 'Protocolista no encontrado'}), 400

    # Crear un nuevo caso en la tabla `case`
    new_case = Case(
        fecha=case_finished.fecha,
        escritura=case_finished.escritura,
        radicado=case_finished.radicado,
        protocolista_id=protocolista.id,
        observaciones=case_finished.observaciones,
        fecha_documento=case_finished.fecha_documento
    )

    db.session.add(new_case)
    db.session.delete(case_finished)  # Eliminar el caso de la tabla `case_finished`
    db.session.commit()

    return jsonify({'message': 'El caso ha sido retornado a la tabla de casos pendientes.'})
