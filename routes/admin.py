from flask import Blueprint, jsonify
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
        'message': f'Đã cập nhật quyền của {user.username} thành {"admin" if user.is_admin else "user"}!',
        'user': user.to_dict()
    })
