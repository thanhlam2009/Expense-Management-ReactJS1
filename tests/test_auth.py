# -*- coding: utf-8 -*-
"""
TC-01 & TC-02: Kiểm thử Xác thực người dùng và Đăng ký (ràng buộc dữ liệu, xác thực email).
Nhóm black-box trên các endpoint /auth/*.
"""
from models.user import User
from tests.conftest import login


# ---------- TC-01: Đăng nhập & bảo mật ----------
def test_login_success(client):
    """Đăng nhập đúng thông tin -> 200 và trả về thông tin người dùng."""
    resp = login(client, 'admin@example.com', 'admin123')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['user']['email'] == 'admin@example.com'
    assert data['user']['is_admin'] is True


def test_login_wrong_password(client):
    """Sai mật khẩu -> 401, không cấp phiên."""
    resp = login(client, 'admin@example.com', 'sai-mat-khau')
    assert resp.status_code == 401
    assert 'error' in resp.get_json()


def test_login_nonexistent_user(client):
    resp = login(client, 'khong-ton-tai@example.com', 'x')
    assert resp.status_code == 401


def test_login_switches_account_without_explicit_logout(client):
    """Đang đăng nhập tài khoản A, gọi /auth/login bằng tài khoản B (không logout trước)
    -> phải chuyển hẳn sang phiên của B, không được kẹt lại ở A."""
    login(client, 'admin@example.com', 'admin123')
    assert client.get('/auth/check-session').get_json()['user']['email'] == 'admin@example.com'

    resp = login(client, 'user@example.com', 'user123')
    assert resp.status_code == 200
    assert resp.get_json()['user']['email'] == 'user@example.com'
    assert client.get('/auth/check-session').get_json()['user']['email'] == 'user@example.com'


def test_login_unverified_account_blocked(client, app):
    """Tài khoản chưa xác thực email -> 403, không được cấp phiên."""
    with app.app_context():
        u = User(email='chuaxacthuc@example.com', full_name='Chưa Xác Thực')
        u.set_password('matkhau123')
        from app import db
        db.session.add(u)
        db.session.commit()

    resp = login(client, 'chuaxacthuc@example.com', 'matkhau123')
    assert resp.status_code == 403
    assert client.get('/auth/check-session').get_json()['authenticated'] is False


def test_protected_endpoint_requires_login(client):
    """Truy cập API cần đăng nhập khi CHƯA đăng nhập -> bị từ chối (302 redirect hoặc 401)."""
    resp = client.get('/api/dashboard/data')
    assert resp.status_code in (301, 302, 401)


def test_check_session_before_and_after_login(client):
    """check-session phản ánh đúng trạng thái đăng nhập."""
    before = client.get('/auth/check-session').get_json()
    assert before['authenticated'] is False

    login(client, 'user@example.com', 'user123')
    after = client.get('/auth/check-session').get_json()
    assert after['authenticated'] is True
    assert after['user']['full_name'] == 'Người dùng Demo'


def test_logout(client):
    login(client, 'user@example.com', 'user123')
    resp = client.get('/auth/logout')
    assert resp.status_code in (200, 302)
    # Sau khi đăng xuất, phiên không còn hợp lệ
    assert client.get('/auth/check-session').get_json()['authenticated'] is False


# ---------- TC-02: Đăng ký & ràng buộc dữ liệu ----------
def test_register_success_requires_email_verification(client, app):
    resp = client.post('/auth/register', json={
        'email': 'moi@example.com',
        'full_name': 'Người Dùng Mới',
        'password': 'matkhau123',
        'confirm_password': 'matkhau123',
    })
    assert resp.status_code == 201

    # Chưa xác thực -> chưa đăng nhập được
    assert login(client, 'moi@example.com', 'matkhau123').status_code == 403

    with app.app_context():
        user = User.query.filter_by(email='moi@example.com').first()
        code = user.verification_code
        assert code is not None

    # Xác thực đúng mã -> được đăng nhập luôn
    verify_resp = client.post('/auth/verify-email', json={'email': 'moi@example.com', 'code': code})
    assert verify_resp.status_code == 200
    assert client.get('/auth/check-session').get_json()['authenticated'] is True


def test_verify_email_wrong_code_rejected(client, app):
    client.post('/auth/register', json={
        'email': 'saima@example.com',
        'full_name': 'Sai Mã',
        'password': 'matkhau123',
        'confirm_password': 'matkhau123',
    })

    resp = client.post('/auth/verify-email', json={'email': 'saima@example.com', 'code': '000000'})
    assert resp.status_code == 400
    assert client.get('/auth/check-session').get_json()['authenticated'] is False


def test_register_duplicate_email(client):
    """Email đã tồn tại (admin@example.com được seed) -> 400."""
    resp = client.post('/auth/register', json={
        'email': 'admin@example.com',
        'full_name': 'Trùng Email',
        'password': 'matkhau123',
        'confirm_password': 'matkhau123',
    })
    assert resp.status_code == 400


def test_register_password_too_short(client):
    resp = client.post('/auth/register', json={
        'email': 'ngan@example.com',
        'full_name': 'Mật Khẩu Ngắn',
        'password': '123',
        'confirm_password': '123',
    })
    assert resp.status_code == 400


def test_register_password_mismatch(client):
    resp = client.post('/auth/register', json={
        'email': 'lech@example.com',
        'full_name': 'Xác Nhận Lệch',
        'password': 'matkhau123',
        'confirm_password': 'matkhau456',
    })
    assert resp.status_code == 400


def test_register_missing_fields(client):
    resp = client.post('/auth/register', json={'email': 'thieu@example.com'})
    assert resp.status_code == 400
