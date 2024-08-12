from flask import Blueprint, jsonify
from models import UserProfile  # Asumiendo que tienes un modelo UserProfile

user_data_bp = Blueprint('user_data', __name__)

@user_data_bp.route('/api/profile/<string:email>', methods=['GET'])
def get_user_profile(email):
    user_profile = UserProfile.query.filter_by(email=email).first()
    if not user_profile:
        return jsonify({'message': 'User not found'}), 404
    
    profile_data = {
        'fullName': f"{user_profile.first_name1} {user_profile.first_name2} {user_profile.last_name1} {user_profile.last_name2}",
        'phoneNumber': user_profile.phone_number,
        'birthDate': user_profile.birth_date.strftime('%a, %d %b %Y %H:%M:%S GMT') if user_profile.birth_date else '',
        'username': user_profile.username,
    }
    return jsonify(profile_data)
