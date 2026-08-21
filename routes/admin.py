from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models.user import User
from app import db
from functools import wraps

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            return jsonify({'error': 'Unauthorized'}), 403
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/users', methods=['POST'])
@login_required
@admin_required
def create_user():
    """[Admin] Tạo tài khoản người dùng mới
    Tài khoản do admin tạo được coi như đã xác thực email luôn (không gửi mã OTP).
    ---
    tags:
      - Admin
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [email, full_name, password]
          properties:
            email:
              type: string
              example: moi@example.com
            full_name:
              type: string
              example: Người Dùng Mới
            password:
              type: string
              example: matkhau123
            is_admin:
              type: boolean
              example: false
    responses:
      201:
        description: Tạo tài khoản thành công
      400:
        description: Dữ liệu không hợp lệ (email đã tồn tại, mật khẩu quá ngắn...)
      403:
        description: Không có quyền (không phải admin)
    """
    data = request.get_json() or {}
    email = data.get('email')
    full_name = data.get('full_name')
    password = data.get('password')
    is_admin = bool(data.get('is_admin', False))

    if not all([email, full_name, password]):
        return jsonify({'error': 'Vui lòng điền đầy đủ thông tin!'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Mật khẩu phải có ít nhất 6 ký tự!'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email đã được sử dụng!'}), 400

    user = User(
        email=email,
        full_name=full_name,
        is_admin=is_admin,
        is_verified=True,
        is_active=True
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({
        'message': f'Đã tạo tài khoản {user.full_name}!',
        'user': user.to_dict()
    }), 201

@admin_bp.route('/users/<int:id>', methods=['PUT'])
@login_required
@admin_required
def update_user(id):
    """[Admin] Cập nhật thông tin người dùng
    ---
    tags:
      - Admin
    parameters:
      - name: id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            email:
              type: string
              example: moi@example.com
            full_name:
              type: string
              example: Người Dùng Mới
            password:
              type: string
              example: matkhaumoi123
    responses:
      200:
        description: Cập nhật thành công
      400:
        description: Dữ liệu không hợp lệ (email đã được dùng bởi tài khoản khác, mật khẩu quá ngắn...)
      403:
        description: Không có quyền (không phải admin)
    """
    user = User.query.get_or_404(id)
    data = request.get_json() or {}

    email = data.get('email')
    full_name = data.get('full_name')
    password = data.get('password')

    if email and email != user.email:
        if User.query.filter(User.email == email, User.id != user.id).first():
            return jsonify({'error': 'Email đã được sử dụng!'}), 400
        user.email = email

    if full_name:
        user.full_name = full_name

    if password:
        if len(password) < 6:
            return jsonify({'error': 'Mật khẩu phải có ít nhất 6 ký tự!'}), 400
        user.set_password(password)

    db.session.commit()

    return jsonify({
        'message': f'Đã cập nhật thông tin của {user.full_name}!',
        'user': user.to_dict()
    })

@admin_bp.route('/users/<int:id>', methods=['DELETE'])
@login_required
@admin_required
def delete_user(id):
    """[Admin] Xóa mềm một tài khoản người dùng
    Tài khoản bị đánh dấu ngưng hoạt động (không đăng nhập được) nhưng dữ liệu giao dịch vẫn được giữ lại.
    ---
    tags:
      - Admin
    parameters:
      - name: id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Đã xóa (vô hiệu hóa) tài khoản
      400:
        description: Không thể tự xóa chính mình
      403:
        description: Không có quyền (không phải admin)
    """
    user = User.query.get_or_404(id)
    if user.id == current_user.id:
        return jsonify({'error': 'Bạn không thể xóa chính mình!'}), 400

    user.is_active = False
    db.session.commit()

    return jsonify({
        'message': f'Đã xóa tài khoản {user.full_name}!',
        'user': user.to_dict()
    })

@admin_bp.route('/users/<int:id>/restore', methods=['POST'])
@login_required
@admin_required
def restore_user(id):
    """[Admin] Khôi phục một tài khoản đã bị xóa mềm
    ---
    tags:
      - Admin
    parameters:
      - name: id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Đã khôi phục tài khoản
      403:
        description: Không có quyền (không phải admin)
    """
    user = User.query.get_or_404(id)
    user.is_active = True
    db.session.commit()

    return jsonify({
        'message': f'Đã khôi phục tài khoản {user.full_name}!',
        'user': user.to_dict()
    })

@admin_bp.route('/users/<int:id>/toggle-admin', methods=['POST'])
@login_required
@admin_required
def toggle_admin(id):
    """[Admin] Cấp / gỡ quyền quản trị cho một người dùng
    ---
    tags:
      - Admin
    parameters:
      - name: id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Đã cập nhật quyền của người dùng
      400:
        description: Không thể tự thay đổi quyền của chính mình
      403:
        description: Không có quyền (không phải admin)
    """
    user = User.query.get_or_404(id)
    if user.id == current_user.id:
        return jsonify({'error': 'Bạn không thể thay đổi quyền của chính mình!'}), 400

    user.is_admin = not user.is_admin
    db.session.commit()

    return jsonify({
        'message': f'Đã cập nhật quyền của {user.full_name} thành {"admin" if user.is_admin else "user"}!',
        'user': user.to_dict()
    })
