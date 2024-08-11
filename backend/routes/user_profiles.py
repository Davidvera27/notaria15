from flask import Blueprint, jsonify, request
from models import UserProfile, db

user_profiles_bp = Blueprint('user_profiles', __name__)

@user_profiles_bp.route('/userprofiles', methods=['GET'])
def get_userprofiles():
    profiles = UserProfile.query.all()
    return jsonify([profile.to_dict() for profile in profiles])

@user_profiles_bp.route('/userprofiles', methods=['POST'])
def add_userprofile():
    data = request.json
    new_profile = UserProfile(
        first_name1=data['first_name1'],
        first_name2=data.get('first_name2'),
        last_name1=data['last_name1'],
        last_name2=data.get('last_name2'),
        phone_number=data['phone_number'],
        email=data['email'],
        birth_date=data['birth_date'],
        username=data['username']
    )
    db.session.add(new_profile)
    db.session.commit()
    return jsonify(new_profile.to_dict())

@user_profiles_bp.route('/userprofiles/<int:id>', methods=['PUT'])
def update_userprofile(id):
    data = request.json
    profile = UserProfile.query.get_or_404(id)
    profile.first_name1 = data.get('first_name1', profile.first_name1)
    profile.first_name2 = data.get('first_name2', profile.first_name2)
    profile.last_name1 = data.get('last_name1', profile.last_name1)
    profile.last_name2 = data.get('last_name2', profile.last_name2)
    profile.phone_number = data.get('phone_number', profile.phone_number)
    profile.email = data.get('email', profile.email)
    profile.birth_date = data.get('birth_date', profile.birth_date)
    profile.username = data.get('username', profile.username)
    db.session.commit()
    return jsonify(profile.to_dict())

@user_profiles_bp.route('/userprofiles/<int:id>', methods=['DELETE'])
def delete_userprofile(id):
    profile = UserProfile.query.get_or_404(id)
    db.session.delete(profile)
    db.session.commit()
    return '', 204

@user_profiles_bp.route('/userprofiles', methods=['GET'])
def get_userprofile_by_email():
    email = request.args.get('email')
    profile = UserProfile.query.filter_by(email=email).first()
    if profile:
        return jsonify(profile.to_dict())
    else:
        return jsonify({'error': 'UserProfile not found'}), 404
