from flask import Blueprint, jsonify, request, current_app as app
from models import Case, Protocolist, db, CaseFinished, InfoEscritura
from utils import send_email_via_outlook, extract_pdf_data
import os
import logging
from marshmallow import Schema, fields, ValidationError
from flask import current_app
from datetime import datetime, timedelta

cases_bp = Blueprint('cases', __name__)

# Definir el esquema de validación con marshmallow
class CaseSchema(Schema):
    fecha = fields.Date(required=True, error_messages={"required": "La fecha es obligatoria"})
    escritura = fields.Integer(required=True, error_messages={"required": "La escritura es obligatoria"})
    radicado = fields.String(required=True, error_messages={"required": "El radicado es obligatorio"})
    protocolista = fields.String(required=True, error_messages={"required": "El protocolista es obligatorio"})
    observaciones = fields.String(missing='')
    fecha_documento = fields.Date(required=True, error_messages={"required": "La fecha del documento es obligatoria"})

@cases_bp.route('/cases', methods=['GET'])
def get_cases():
    cases = Case.query.all()
    result = []
    for case in cases:
        case_data = case.to_dict()
        result.append(case_data)
    return jsonify(result)

@cases_bp.route('/cases', methods=['POST'])
def add_case():
    from app import socketio  # Importar aquí para evitar la importación circular
    schema = CaseSchema()
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    try:
        # Buscar el protocolista
        protocolista = Protocolist.query.filter_by(nombre=data['protocolista']).first()
        if not protocolista:
            return jsonify({'error': 'Protocolista no encontrado'}), 400

        # Crear el nuevo caso en la tabla "case"
        new_case = Case(
            fecha=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),  # Fecha y hora actuales
            escritura=int(data['escritura']),
            radicado=data['radicado'],
            protocolista_id=protocolista.id,
            observaciones=data.get('observaciones', ''),
            fecha_documento=data.get('fecha_documento')
        )
        db.session.add(new_case)
        db.session.commit()

        # Crear el nuevo registro en la tabla "info_escritura"
        new_info_escritura = InfoEscritura(
            escritura=new_case.escritura,
            fecha_documento=new_case.fecha_documento,
            protocolista_id=new_case.protocolista_id,
            radicado=new_case.radicado,
            vigencia_rentas=None  # Este campo es opcional
        )
        db.session.add(new_info_escritura)
        db.session.commit()

        # Emitir evento a todos los clientes conectados
        socketio.emit('new_case', new_case.to_dict())

        return jsonify(new_case.to_dict())
    except Exception as e:
        db.session.rollback()
        print(f"Error al crear el caso: {e}")
        return jsonify({'error': 'Hubo un problema al crear el caso.'}), 500

# Función para calcular el estado de vigencia
def calcular_estado_vigencia(vigencia_rentas):
    # Convertir la fecha de vigencia de string a objeto datetime
    try:
        vigencia_rentas_date = datetime.strptime(vigencia_rentas, '%d.%m.%Y').date()
    except ValueError:
        return "Formato de fecha incorrecto para la vigencia."

    fecha_actual = datetime.now().date()
    dias_restantes = (vigencia_rentas_date - fecha_actual).days

    if dias_restantes < 0:
        return f"El caso ha vencido hace {-dias_restantes} días."
    elif dias_restantes <= 30:
        return f"El caso está próximo a vencer en {dias_restantes} días."
    else:
        return f"El caso está vigente con {dias_restantes} días restantes."

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

    info_escritura = InfoEscritura.query.filter_by(radicado=case.radicado).first()
    if not info_escritura or not info_escritura.vigencia_rentas:
        return jsonify({'error': 'Vigencia not found for this case'}), 404

    vigencia_rentas = info_escritura.vigencia_rentas
    estado_vigencia = calcular_estado_vigencia(vigencia_rentas)

    # Crear el cuerpo del correo con la fecha de vigencia
    subject = f"BOLETA DE RENTAS {radicado}"
    body = f"""
    Señor(a) {protocolista.nombre},

    Adjunto encontrará el documento Liquidación De Impuesto De Registro correspondiente al radicado No. {radicado} de la escritura {case.escritura}.
    
    La fecha de vigencia del caso es {vigencia_rentas}.
    {estado_vigencia}

    Por favor, tome las acciones necesarias si el caso está próximo a vencer.

    Atentamente,
    Auxiliar de rentas Notaría 15.
    """

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

    # Crear el cuerpo del correo con la fecha de vigencia
    subject = f"BOLETA DE RENTAS {radicado}"
    body = f"""
    Señor(a) {protocolista.nombre},

    Adjunto encontrará el documento Liquidación De Impuesto De Registro correspondiente al radicado No. {radicado} de la escritura {case.escritura}.
    
    La fecha de vigencia del caso es {vigencia_rentas}.
    {estado_vigencia}

    Por favor, tome las acciones necesarias si el caso está próximo a vencer.

    Atentamente,
    Auxiliar de rentas Notaría 15.
    """

    try:
        send_email_via_outlook(recipients=[protocolista.correo_electronico], 
                               subject=subject, 
                               body=body, 
                               attachments=[pdf_path])

        # Verificar si el caso ya existe en `case_finished` basado en el radicado
        finished_case = CaseFinished.query.filter_by(radicado=case.radicado).first()
        if finished_case:
            # Si ya existe, incrementar el contador de envíos
            finished_case.envios += 1
        else:
            # Si no existe, mover el caso a la tabla `case_finished`
            finished_case = CaseFinished(
                fecha=case.fecha,
                escritura=case.escritura,
                radicado=case.radicado,
                protocolista=protocolista.nombre,
                observaciones=case.observaciones,
                fecha_documento=case.fecha_documento,
                envios=1
            )
            db.session.add(finished_case)

        # Actualizar la columna fecha_envio_rentas en la tabla "info_escritura"
        info_escritura.fecha_envio_rentas = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        db.session.commit()

        # Eliminar el caso de la tabla `case`
        db.session.delete(case)
        db.session.commit()

        return jsonify({'message': 'El documento ha sido enviado con éxito y el caso ha sido archivado.'})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error al mover el caso de `case` a `case_finished`: {str(e)}')
        return jsonify({'error': f'Hubo un problema al enviar el correo: {str(e)}'}), 500

logging.basicConfig(level=logging.DEBUG)

@cases_bp.route('/cases/<int:id>', methods=['PUT'])
def update_case(id):
    from app import socketio  # Importar aquí para evitar la importación circular
    try:
        logging.debug(f"Attempting to update case with ID: {id}")
        data = request.json
        case = Case.query.get(id)
        logging.debug(f"Case data before update: {case.to_dict()}")
        if not case:
            return jsonify({'error': 'Case not found'}), 404

        # Update all fields including protocolista, escritura, fecha, observaciones
        protocolista = Protocolist.query.filter_by(nombre=data['protocolista']).first()
        if not protocolista:
            return jsonify({'error': 'Protocolista no encontrado'}), 400

        case.fecha = data['fecha']
        case.escritura = int(data['escritura'])
        case.radicado = data['radicado']
        case.protocolista_id = protocolista.id
        case.observaciones = data.get('observaciones', '')

        db.session.commit()

        # Emitir evento de actualización de caso
        socketio.emit('update_case', case.to_dict())

        logging.debug(f"Case updated successfully.")
        return jsonify(case.to_dict())
    except ValidationError as err:
        logging.error(f"Validation error: {err.messages}")
        return jsonify({"errors": err.messages}), 400
    except Exception as e:
        logging.error(f"Error al actualizar el caso: {e}")
        return jsonify({'error': f'Hubo un problema al actualizar el caso: {e}'}), 500

@cases_bp.route('/cases/<int:id>', methods=['DELETE'])
def delete_case(id):
    case = Case.query.get(id)
    if not case:
        return jsonify({'error': 'Case not found'}), 404

    db.session.delete(case)
    db.session.commit()
    return '', 204
