# -*- coding: utf-8 -*-
"""
TC-04: Kiểm thử phân quyền Admin/User trên các API quản trị.
"""


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
