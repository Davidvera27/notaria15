from flask import Blueprint, request, jsonify
from models import db, Contabilidad
from datetime import datetime

contabilidad_bp = Blueprint('contabilidad', __name__)

# Get all records
@contabilidad_bp.route('/contabilidad', methods=['GET'])
def get_all_records():
    records = Contabilidad.query.all()
    return jsonify([record.to_dict() for record in records])

# Add new record
@contabilidad_bp.route('/contabilidad', methods=['POST'])
def add_contabilidad():
    data = request.get_json()
    new_contabilidad = Contabilidad(
        protocolista=data['protocolista'],
        factura_no=data['facturaNo'],
        esc=data['esc'],
        fact_canceladas=data['factCanceladas'],
        fact_sin_cancelar=data['factSinCancelar'],
        total_fact_sin_cancelar=data['totalFactSinCancelar'],
        total_fact_canceladas=data['totalFactCanceladas'],
        fecha=datetime.strptime(data['fecha'], '%Y-%m-%d').date(),
        rentas_pse=data['rentasPse'],
        rentas_efectivo=data['rentasEfectivo'],
        registro_pse=data['registroPse'],
        registro_efectivo=data['registroEfectivo'],
        total_r_yr=data['totalRYR'],
        devolucion=data['devolucion'],
        excedentes=data['excedentes'],
        total_rentas_registro=data['totalRentasRegistro'],
        observaciones=data.get('observaciones', '')
    )
    db.session.add(new_contabilidad)
    db.session.commit()
    return jsonify(new_contabilidad.to_dict()), 201


# Update record
@contabilidad_bp.route('/contabilidad/<int:id>', methods=['PUT'])
def update_record(id):
    data = request.get_json()
    record = Contabilidad.query.get_or_404(id)
    
    record.protocolista = data['protocolista']
    record.factura_no = data['facturaNo']
    record.esc = data['esc']
    record.fact_canceladas = data['factCanceladas']
    record.fact_sin_cancelar = data['factSinCancelar']
    record.total_fact_sin_cancelar = data['totalFactSinCancelar']
    record.total_fact_canceladas = data['totalFactCanceladas']
    record.fecha = datetime.strptime(data['fecha'], '%Y-%m-%d').date()
    record.rentas_pse = data['rentasPse']
    record.rentas_efectivo = data['rentasEfectivo']
    record.registro_pse = data['registroPse']
    record.registro_efectivo = data['registroEfectivo']
    record.total_r_yr = data['totalRYR']
    record.devolucion = data['devolucion']
    record.excedentes = data['excedentes']
    record.total_rentas_registro = data['totalRentasRegistro']
    record.observaciones = data['observaciones']
    
    db.session.commit()
    return jsonify(record.to_dict()), 200

# Delete record
@contabilidad_bp.route('/contabilidad/<int:id>', methods=['DELETE'])
def delete_record(id):
    record = Contabilidad.query.get_or_404(id)
    db.session.delete(record)
    db.session.commit()
    return jsonify({'message': 'Record deleted successfully'}), 200
