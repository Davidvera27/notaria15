from flask import Blueprint, jsonify, request
from models import Protocolist, db

protocolists_bp = Blueprint('protocolists', __name__)

@protocolists_bp.route('/protocolists', methods=['GET'])
def get_protocolists():
    # Ordena los protocolistas por el campo 'nombre' de forma ascendente (alfabético)
    protocolists = Protocolist.query.order_by(Protocolist.nombre.asc()).all()
    return jsonify([protocolist.to_dict() for protocolist in protocolists])


@protocolists_bp.route('/protocolists', methods=['POST'])
def add_protocolist():
    data = request.json
    new_protocolist = Protocolist(
        nombre=data['nombre'], 
        correo_electronico=data['correo_electronico']
    )
    db.session.add(new_protocolist)
    db.session.commit()
    return jsonify(new_protocolist.to_dict())

@protocolists_bp.route('/protocolists/<int:id>', methods=['PUT'])
def update_protocolist(id):
    protocolist = Protocolist.query.get_or_404(id)
    data = request.json
    protocolist.nombre = data['nombre']
    protocolist.correo_electronico = data['correo_electronico']
    db.session.commit()
    return jsonify(protocolist.to_dict())

@protocolists_bp.route('/protocolists/<int:id>', methods=['DELETE'])
def delete_protocolist(id):
    protocolist = Protocolist.query.get_or_404(id)
    db.session.delete(protocolist)
    db.session.commit()
    return jsonify({'message': 'Protocolist deleted successfully'})
