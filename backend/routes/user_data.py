from flask import Blueprint, jsonify, request
from models import db, UserProfile

user_data_bp = Blueprint('user_data', __name__)

# Ruta para obtener los datos de un usuario específico
@user_data_bp.route('/userdata/<int:id>', methods=['GET'])
def get_user_profile(id):
    user = UserProfile.query.get_or_404(id)
    return jsonify(user.to_dict())

# Ruta para obtener todos los perfiles de usuario (opcional)
@user_data_bp.route('/userdata', methods=['GET'])
def get_all_user_profiles():
    users = UserProfile.query.all()
    return jsonify([user.to_dict() for user in users])
