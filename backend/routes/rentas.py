from flask import Blueprint, jsonify, request
from models import db, Case, Protocolist  # Asegúrate de importar el modelo Protocolist

rentas = Blueprint('rentas', __name__)

# Obtener todos los casos
@rentas.route('/cases', methods=['GET'])
def get_cases():
    cases = Case.query.all()
    return jsonify([case.to_dict() for case in cases])

# Obtener un caso por ID
@rentas.route('/cases/<int:id>', methods=['GET'])
def get_case(id):
    case = Case.query.get_or_404(id)
    return jsonify(case.to_dict())

# Añadir un nuevo caso
@rentas.route('/cases', methods=['POST'])
def add_case():
    data = request.json
    new_case = Case(
        fecha=data['fecha'],
        escritura=data['escritura'],
        radicado=data['radicado'],
        protocolista=data['protocolista']
    )
    db.session.add(new_case)
    db.session.commit()
    return jsonify(new_case.to_dict())

# Actualizar un caso existente
@rentas.route('/cases/<int:id>', methods=['PUT'])
def update_case(id):
    case = Case.query.get_or_404(id)
    data = request.json
    case.fecha = data['fecha']
    case.escritura = data['escritura']
    case.radicado = data['radicado']
    case.protocolista = data['protocolista']
    db.session.commit()
    return jsonify(case.to_dict())

# Eliminar un caso
@rentas.route('/cases/<int:id>', methods=['DELETE'])
def delete_case(id):
    case = Case.query.get_or_404(id)
    db.session.delete(case)
    db.session.commit()
    return jsonify({'message': 'Case deleted successfully'})

# Obtener todos los protocolistas
@rentas.route('/protocolists', methods=['GET'])
def get_protocolists():
    protocolists = Protocolist.query.all()
    return jsonify([protocolist.to_dict() for protocolist in protocolists])

# Registrar el Blueprint en la aplicación
def register_blueprints(app):
    app.register_blueprint(rentas)
