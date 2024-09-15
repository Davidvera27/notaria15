from flask import Blueprint, request, jsonify
from models import db, UserProfile
from sqlalchemy.exc import IntegrityError
import datetime

user_profiles_bp = Blueprint('user_profiles', __name__)

@user_profiles_bp.route('/userprofiles', methods=['POST'])
def add_userprofile():
    data = request.get_json()

    # Validate required fields
    required_fields = ['full_name', 'last_name', 'phone_number', 'email', 'birth_date']
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    if missing_fields:
        return jsonify({'error': f'Missing fields: {", ".join(missing_fields)}'}), 400

    try:
        # Parse birth_date and validate date format
        birth_date = datetime.datetime.strptime(data['birth_date'], '%Y-%m-%d').date()

        new_user = UserProfile(
            full_name=data['full_name'],
            last_name=data['last_name'],
            phone_number=data['phone_number'],
            email=data['email'],
            birth_date=birth_date,
            username=f"{data['full_name'].replace(' ', '')}{data['phone_number']}"  # Username logic
        )

        db.session.add(new_user)
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
