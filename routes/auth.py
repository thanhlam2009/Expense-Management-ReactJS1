from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from models.user import User
from app import db
from services.mail_service import send_verification_email_async

auth_bp = Blueprint('auth', __name__)

def _user_dict(user):
    return {
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'is_admin': user.is_admin,
        'is_verified': user.is_verified
    }

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """Đăng nhập
    Đăng nhập bằng email/mật khẩu, tạo phiên đăng nhập qua cookie (session).
    ---
    tags:
      - Auth
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [email, password]
          properties:
            email:
              type: string
              example: admin@example.com
            password:
              type: string
              example: admin123
            remember:
              type: boolean
              example: false
    responses:
      200:
        description: Đăng nhập thành công, trả về thông tin người dùng
      401:
        description: Email hoặc mật khẩu không đúng
      403:
        description: Tài khoản chưa xác thực email
    """
    if current_user.is_authenticated:
        return jsonify({'user': _user_dict(current_user)})

    if request.method == 'POST':
        data = request.get_json() or {}
        email = data.get('email')
        password = data.get('password')
        remember = bool(data.get('remember', False))

        user = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            if not user.is_active:
                return jsonify({'error': 'Tài khoản đã bị vô hiệu hóa.'}), 403

            if not user.is_verified:
                return jsonify({
                    'error': 'Tài khoản chưa xác thực email. Vui lòng kiểm tra hộp thư và nhập mã xác thực.',
                    'email': user.email
                }), 403

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
    """Đăng ký tài khoản mới
    Sau khi đăng ký, hệ thống gửi mã OTP xác thực tới email; tài khoản phải xác thực mới đăng nhập được.
    ---
    tags:
      - Auth
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [email, full_name, password, confirm_password]
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
            confirm_password:
              type: string
              example: matkhau123
    responses:
      201:
        description: Đăng ký thành công, đã gửi mã xác thực tới email
      400:
        description: Dữ liệu không hợp lệ (email đã tồn tại, mật khẩu quá ngắn, xác nhận không khớp...)
    """
    if current_user.is_authenticated:
        return jsonify({'error': 'Already authenticated'}), 400

    if request.method == 'POST':
        data = request.get_json() or {}
        email = data.get('email')
        full_name = data.get('full_name')
        password = data.get('password')
        confirm_password = data.get('confirm_password')

        if not all([email, full_name, password, confirm_password]):
            return jsonify({'error': 'Vui lòng điền đầy đủ thông tin!'}), 400

        if password != confirm_password:
            return jsonify({'error': 'Mật khẩu xác nhận không khớp!'}), 400

        if len(password) < 6:
            return jsonify({'error': 'Mật khẩu phải có ít nhất 6 ký tự!'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email đã được sử dụng!'}), 400

        user = User(
            email=email,
            full_name=full_name
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        code = user.generate_verification_code()
        send_verification_email_async(user, code)

        return jsonify({
            'message': 'Đăng ký thành công! Vui lòng kiểm tra email để lấy mã xác thực.',
            'email': user.email
        }), 201

    return jsonify({'error': 'Method not allowed'}), 405

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """Xác thực email bằng mã OTP
    Nếu mã hợp lệ, tài khoản được xác thực và đăng nhập luôn.
    ---
    tags:
      - Auth
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [email, code]
          properties:
            email:
              type: string
              example: moi@example.com
            code:
              type: string
              example: "123456"
    responses:
      200:
        description: Xác thực thành công, đã đăng nhập
      400:
        description: Mã không đúng hoặc đã hết hạn
    """
    data = request.get_json() or {}
    email = data.get('email')
    code = data.get('code')

    user = User.query.filter_by(email=email).first()
    if not user or not code or not user.verify_code(code):
        return jsonify({'error': 'Mã xác thực không đúng hoặc đã hết hạn!'}), 400

    login_user(user)
    user.update_last_login()
    return jsonify({
        'message': 'Xác thực email thành công!',
        'user': _user_dict(user)
    })

@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """Gửi lại mã xác thực email
    ---
    tags:
      - Auth
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [email]
          properties:
            email:
              type: string
              example: moi@example.com
    responses:
      200:
        description: Đã gửi lại mã xác thực
      400:
        description: Email không tồn tại hoặc đã xác thực
    """
    data = request.get_json() or {}
    email = data.get('email')

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Email không tồn tại!'}), 400

    if user.is_verified:
        return jsonify({'error': 'Tài khoản đã được xác thực!'}), 400

    code = user.generate_verification_code()
    send_verification_email_async(user, code)

    return jsonify({'message': 'Đã gửi lại mã xác thực. Vui lòng kiểm tra email.'})

@auth_bp.route('/logout')
@login_required
def logout():
    """Đăng xuất
    Xóa phiên đăng nhập hiện tại.
    ---
    tags:
      - Auth
    responses:
      200:
        description: Đăng xuất thành công
    """
    logout_user()
    return jsonify({'message': 'Đã đăng xuất thành công!'})

@auth_bp.route('/check-session')
def check_session():
    """Kiểm tra trạng thái đăng nhập
    Dùng để frontend kiểm tra xem cookie phiên hiện tại còn hợp lệ không.
    ---
    tags:
      - Auth
    responses:
      200:
        description: Trạng thái xác thực hiện tại (authenticated true/false)
    """
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'user': _user_dict(current_user)
        })
    return jsonify({'authenticated': False})
