from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from models.user import User
from app import db

auth_bp = Blueprint('auth', __name__)

def _user_dict(user):
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'full_name': user.full_name,
        'is_admin': user.is_admin
    }

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return jsonify({'user': _user_dict(current_user)})

    if request.method == 'POST':
        data = request.get_json() or {}
        email = data.get('email')
        password = data.get('password')
        remember = bool(data.get('remember', False))

        user = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            login_user(user, remember=remember)
            user.update_last_login()
            return jsonify({
                'message': f'Chào mừng {user.full_name}!',
                'user': _user_dict(user)
            })

        return jsonify({'error': 'Email hoặc mật khẩu không đúng!'}), 401

    return jsonify({'error': 'Method not allowed'}), 405

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return jsonify({'error': 'Already authenticated'}), 400

    if request.method == 'POST':
        data = request.get_json() or {}
        username = data.get('username')
        email = data.get('email')
        full_name = data.get('full_name')
        password = data.get('password')
        confirm_password = data.get('confirm_password')

        if not all([username, email, full_name, password, confirm_password]):
            return jsonify({'error': 'Vui lòng điền đầy đủ thông tin!'}), 400

        if password != confirm_password:
            return jsonify({'error': 'Mật khẩu xác nhận không khớp!'}), 400

        if len(password) < 6:
            return jsonify({'error': 'Mật khẩu phải có ít nhất 6 ký tự!'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email đã được sử dụng!'}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Tên đăng nhập đã được sử dụng!'}), 400

        user = User(
            username=username,
            email=email,
            full_name=full_name
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        return jsonify({'message': 'Đăng ký thành công! Vui lòng đăng nhập.'}), 201

    return jsonify({'error': 'Method not allowed'}), 405

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Đã đăng xuất thành công!'})

@auth_bp.route('/check-session')
def check_session():
    """Check if user is authenticated (for React app)"""
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'email': current_user.email,
                'full_name': current_user.full_name,
                'is_admin': current_user.is_admin
            }
        })
    return jsonify({'authenticated': False})