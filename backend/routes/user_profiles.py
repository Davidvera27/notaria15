from flask import Blueprint, request, jsonify
from models import db, UserProfile
from sqlalchemy.exc import IntegrityError
import datetime

user_profiles_bp = Blueprint('user_profiles', __name__)

@user_profiles_bp.route('/userprofiles', methods=['POST'])
def add_userprofile():
    data = request.get_json()

    # Validar campos requeridos, incluido el rol
    required_fields = ['full_name', 'last_name', 'phone_number', 'email', 'birth_date', 'role']
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    if missing_fields:
        return jsonify({'error': f'Missing fields: {", ".join(missing_fields)}'}), 400

    try:
        # Validar la fecha de nacimiento
        birth_date = datetime.datetime.strptime(data['birth_date'], '%Y-%m-%d').date()

        # Crear nuevo perfil de usuario con el rol
        new_user = UserProfile(
            full_name=data['full_name'],
            last_name=data['last_name'],
            phone_number=data['phone_number'],
            email=data['email'],
            birth_date=birth_date,
            username='',
            role=data['role']  # Asignar el rol
        )

        db.session.add(new_user)
        db.session.commit()

        # Generar el nombre de usuario basado en el ID generado
        new_user.username = f"{new_user.full_name}{new_user.last_name}{new_user.id}".replace(' ', '')
        db.session.commit()

        return jsonify({'message': 'User created successfully'}), 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'User with the same email or username already exists'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid birth_date format, should be YYYY-MM-DD'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@user_profiles_bp.route('/userprofiles', methods=['GET'])
def get_userprofiles():
    users = UserProfile.query.all()
    return jsonify([user.to_dict() for user in users])
