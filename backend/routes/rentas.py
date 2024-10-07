from flask import Blueprint, jsonify, request
from models import InfoEscritura, Protocolist
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Definir el Blueprint
rentas_bp = Blueprint('rentas', __name__)

@rentas_bp.route('/protocolists', methods=['GET'])
def get_protocolists():
    protocolists = Protocolist.query.all()
    protocolist_data = [{'id': p.id, 'nombre': p.nombre} for p in protocolists]
    return jsonify(protocolist_data), 200

@rentas_bp.route('/rentas/<int:protocolista_id>', methods=['GET'])
def get_casos_by_protocolista(protocolista_id):
    casos = InfoEscritura.query.filter_by(protocolista_id=protocolista_id).all()
    casos_data = [{'id': caso.id, 'num_escritura': caso.escritura, 'fecha_escritura': caso.fecha_documento,
                   'radicado': caso.radicado, 'total_pagado': caso.total_pagado or 0, 
                   'vigencia_rentas': caso.vigencia_rentas} for caso in casos]
    return jsonify(casos_data), 200

