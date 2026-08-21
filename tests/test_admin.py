# -*- coding: utf-8 -*-
"""
TC-04: Kiểm thử phân quyền Admin/User trên các API quản trị.
TC-08: Kiểm thử CRUD tài khoản người dùng (Admin).
"""
from tests.conftest import login


def test_admin_stats_forbidden_for_normal_user(user_client):
    """Người dùng thường gọi API admin -> 403 Unauthorized."""
    resp = user_client.get('/api/admin/stats')
    assert resp.status_code == 403


def test_admin_stats_ok_for_admin(admin_client):
    """Admin gọi API admin -> 200 và trả về đủ các trường thống kê."""
    resp = admin_client.get('/api/admin/stats')
    assert resp.status_code == 200
    data = resp.get_json()
    for key in ('total_users', 'total_transactions', 'total_income',
                'total_expense', 'recent_users', 'top_categories'):
        assert key in data
    # Đã seed ít nhất 2 người dùng (admin + user)
    assert data['total_users'] >= 2


def test_admin_users_requires_admin(user_client):
    assert user_client.get('/api/admin/users').status_code == 403


def test_admin_users_list_for_admin(admin_client):
    resp = admin_client.get('/api/admin/users')
    assert resp.status_code == 200
    assert 'users' in resp.get_json()


def test_admin_endpoints_require_login(client):
    """Chưa đăng nhập -> bị từ chối (302 redirect hoặc 401)."""
    assert client.get('/api/admin/stats').status_code in (301, 302, 401)


# ---------- TC-08: CRUD tài khoản người dùng ----------
def test_create_user_forbidden_for_normal_user(user_client):
    resp = user_client.post('/admin/users', json={
        'email': 'khac@example.com', 'full_name': 'Khac', 'password': 'matkhau123'
    })
    assert resp.status_code == 403


def test_create_user_success_is_verified_and_active(admin_client):
    resp = admin_client.post('/admin/users', json={
        'email': 'tao-moi@example.com', 'full_name': 'Tao Moi', 'password': 'matkhau123'
    })
    assert resp.status_code == 201
    user = resp.get_json()['user']
    assert user['is_verified'] is True
    assert user['is_active'] is True
    assert user['is_admin'] is False

    # Tài khoản admin tạo không cần xác thực email, đăng nhập được ngay
    # (đăng xuất admin trước, nếu không login() sẽ chỉ trả về phiên admin đang có sẵn)
    admin_client.get('/auth/logout')
    assert login(admin_client, 'tao-moi@example.com', 'matkhau123').status_code == 200


def test_create_user_duplicate_email_rejected(admin_client):
    resp = admin_client.post('/admin/users', json={
        'email': 'admin@example.com', 'full_name': 'Trung Email', 'password': 'matkhau123'
    })
    assert resp.status_code == 400


def test_create_user_missing_fields_rejected(admin_client):
    resp = admin_client.post('/admin/users', json={'email': 'thieu@example.com'})
    assert resp.status_code == 400


def test_update_user_success(admin_client):
    created = admin_client.post('/admin/users', json={
        'email': 'sua@example.com', 'full_name': 'Truoc Sua', 'password': 'matkhau123'
    }).get_json()['user']

    resp = admin_client.put(f'/admin/users/{created["id"]}', json={'full_name': 'Sau Sua'})
    assert resp.status_code == 200
    assert resp.get_json()['user']['full_name'] == 'Sau Sua'


def test_update_user_duplicate_email_rejected(admin_client):
    created = admin_client.post('/admin/users', json={
        'email': 'sua2@example.com', 'full_name': 'User Sua', 'password': 'matkhau123'
    }).get_json()['user']

    resp = admin_client.put(f'/admin/users/{created["id"]}', json={'email': 'admin@example.com'})
    assert resp.status_code == 400


def test_delete_user_soft_deletes_and_blocks_login(admin_client):
    created = admin_client.post('/admin/users', json={
        'email': 'xoa@example.com', 'full_name': 'Bi Xoa', 'password': 'matkhau123'
    }).get_json()['user']

    resp = admin_client.delete(f'/admin/users/{created["id"]}')
    assert resp.status_code == 200
    assert resp.get_json()['user']['is_active'] is False

    # Tài khoản bị xóa mềm -> không đăng nhập được nữa
    admin_client.get('/auth/logout')
    assert login(admin_client, 'xoa@example.com', 'matkhau123').status_code == 403


def test_admin_cannot_delete_self(admin_client):
    me = admin_client.get('/api/admin/users').get_json()['current_user_id']
    resp = admin_client.delete(f'/admin/users/{me}')
    assert resp.status_code == 400


def test_restore_user_allows_login_again(admin_client):
    created = admin_client.post('/admin/users', json={
        'email': 'khoi-phuc@example.com', 'full_name': 'Khoi Phuc', 'password': 'matkhau123'
    }).get_json()['user']

    admin_client.delete(f'/admin/users/{created["id"]}')
    resp = admin_client.post(f'/admin/users/{created["id"]}/restore')
    assert resp.status_code == 200
    assert resp.get_json()['user']['is_active'] is True

    admin_client.get('/auth/logout')
    assert login(admin_client, 'khoi-phuc@example.com', 'matkhau123').status_code == 200
