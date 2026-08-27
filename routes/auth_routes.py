from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.user import db, User
from utils.auth_utils import is_valid_phone, is_valid_password

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()

    name = data.get('name', '').strip()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')

    if not name or not phone or not password:
        return jsonify({'error': 'All fields are required.'}), 400

    if not is_valid_phone(phone):
        return jsonify({'error': 'Invalid phone number format.'}), 400

    if not is_valid_password(password):
        return jsonify({'error': 'Password must be at least 4 characters.'}), 400

    if User.query.filter_by(phone=phone).first():
        return jsonify({'error': 'This phone number is already registered.'}), 409

    user = User(name=name, phone=phone)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=user.id)

    return jsonify({
        'message': 'Account created successfully.',
        'access_token': access_token,
        'user': user.to_dict(),
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    phone = data.get('phone', '').strip()
    password = data.get('password', '')

    if not phone or not password:
        return jsonify({'error': 'Phone number and password are required.'}), 400

    user = User.query.filter_by(phone=phone).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid phone number or password.'}), 401

    access_token = create_access_token(identity=user.id)

    return jsonify({
        'message': 'Login successful.',
        'access_token': access_token,
        'user': user.to_dict(),
    }), 200


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    phone = data.get('phone', '').strip()

    if not is_valid_phone(phone):
        return jsonify({'error': 'Invalid phone number format.'}), 400

    user = User.query.filter_by(phone=phone).first()

    if not user:
        return jsonify({'message': 'If this number is registered, a reset code has been sent.'}), 200

    return jsonify({'message': 'A reset code has been sent to your phone.'}), 200


@auth_bp.route('/language', methods=['POST'])
@jwt_required()
def update_language():
    user_id = get_jwt_identity()
    data = request.get_json()
    language = data.get('language')

    if language not in ['en', 'ur']:
        return jsonify({'error': 'Language must be "en" or "ur".'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    user.preferred_language = language
    db.session.commit()

    return jsonify({
        'message': 'Language preference updated.',
        'preferred_language': user.preferred_language,
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found.'}), 404

    return jsonify({'user': user.to_dict()}), 200