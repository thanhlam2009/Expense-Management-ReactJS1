# -*- coding: utf-8 -*-
"""
TC-05: Kiểm thử Ngân sách tháng.
TC-06: Kiểm thử white-box mức đơn vị cho model (băm mật khẩu bcrypt).
TC-07: Kiểm thử Danh mục.
"""
from models.user import User
from tests.conftest import login


# ---------- TC-05: Ngân sách ----------
def test_set_and_get_budget(user_client):
    resp = user_client.post('/api/budget/set', json={'budget_limit': 5000000})
    assert resp.status_code == 200
    assert resp.get_json()['success'] is True

    current = user_client.get('/api/budget/current').get_json()
    assert current['budget_limit'] == 5000000


def test_set_budget_rejects_non_positive(user_client):
    resp = user_client.post('/api/budget/set', json={'budget_limit': 0})
    assert resp.status_code == 400
    assert resp.get_json()['success'] is False


# ---------- TC-06: White-box - băm mật khẩu bcrypt ----------
def test_password_is_hashed_not_plaintext(app):
    """Mật khẩu phải được băm (bcrypt), không lưu dạng plaintext."""
    with app.app_context():
        u = User(email='hash@example.com', full_name='Hash Test')
        u.set_password('matkhau-goc')
        assert u.password_hash != 'matkhau-goc'
        assert u.password_hash.startswith('$2')  # tiền tố định danh của bcrypt
        assert u.check_password('matkhau-goc') is True
        assert u.check_password('sai') is False


def test_password_hash_is_salted(app):
    """Cùng một mật khẩu nhưng hai lần băm cho ra hash khác nhau (nhờ salt ngẫu nhiên)."""
    with app.app_context():
        a = User(email='a@example.com', full_name='A')
        b = User(email='b@example.com', full_name='B')
        a.set_password('cung-mat-khau')
        b.set_password('cung-mat-khau')
        assert a.password_hash != b.password_hash


# ---------- TC-07: Danh mục ----------
def test_get_categories_seeded(user_client):
    cats = user_client.get('/api/categories').get_json()
    assert isinstance(cats, list) and len(cats) > 0
    types = {c['type'] for c in cats}
    assert 'income' in types and 'expense' in types


def test_create_category(admin_client):
    resp = admin_client.post('/api/categories', json={
        'name': 'Danh mục kiểm thử', 'type': 'expense', 'description': 'mô tả'
    })
    assert resp.status_code == 201
    assert resp.get_json()['name'] == 'Danh mục kiểm thử'


def test_create_duplicate_category_rejected(admin_client):
    payload = {'name': 'Trùng lặp', 'type': 'income'}
    assert admin_client.post('/api/categories', json=payload).status_code == 201
    assert admin_client.post('/api/categories', json=payload).status_code == 400


def test_create_category_forbidden_for_normal_user(user_client):
    resp = user_client.post('/api/categories', json={
        'name': 'Danh mục lén tạo', 'type': 'expense'
    })
    assert resp.status_code == 403


def _create_category(client, name, type_='expense'):
    resp = client.post('/api/categories', json={'name': name, 'type': type_})
    assert resp.status_code == 201
    return resp.get_json()['id']


def test_update_category_success(admin_client):
    cat_id = _create_category(admin_client, 'Cần sửa')
    resp = admin_client.put(f'/api/categories/{cat_id}', json={
        'name': 'Đã sửa', 'type': 'expense', 'description': 'mô tả mới'
    })
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['name'] == 'Đã sửa'
    assert data['description'] == 'mô tả mới'


def test_update_category_forbidden_for_normal_user(client):
    login(client, 'admin@example.com', 'admin123')
    cat_id = _create_category(client, 'Không cho sửa')
    client.get('/auth/logout')

    login(client, 'user@example.com', 'user123')
    resp = client.put(f'/api/categories/{cat_id}', json={
        'name': 'Hack', 'type': 'expense'
    })
    assert resp.status_code == 403


def test_update_category_rejects_type_change_when_in_use(client):
    login(client, 'admin@example.com', 'admin123')
    cat_id = _create_category(client, 'Đang dùng')
    client.get('/auth/logout')

    login(client, 'user@example.com', 'user123')
    tx = client.post('/api/transactions', json={
        'amount': 10000, 'type': 'expense', 'category_id': cat_id, 'date': '2026-01-01'
    })
    assert tx.status_code == 201
    client.get('/auth/logout')

    login(client, 'admin@example.com', 'admin123')
    resp = client.put(f'/api/categories/{cat_id}', json={
        'name': 'Đang dùng', 'type': 'income'
    })
    assert resp.status_code == 400


def test_delete_category_success(admin_client):
    cat_id = _create_category(admin_client, 'Sẽ bị xóa')
    resp = admin_client.delete(f'/api/categories/{cat_id}')
    assert resp.status_code == 204


def test_delete_category_rejected_when_in_use(client):
    login(client, 'admin@example.com', 'admin123')
    cat_id = _create_category(client, 'Có giao dịch')
    client.get('/auth/logout')

    login(client, 'user@example.com', 'user123')
    tx = client.post('/api/transactions', json={
        'amount': 10000, 'type': 'expense', 'category_id': cat_id, 'date': '2026-01-01'
    })
    assert tx.status_code == 201
    client.get('/auth/logout')

    login(client, 'admin@example.com', 'admin123')
    resp = client.delete(f'/api/categories/{cat_id}')
    assert resp.status_code == 400


def test_delete_category_forbidden_for_normal_user(client):
    login(client, 'admin@example.com', 'admin123')
    cat_id = _create_category(client, 'User không được xóa')
    client.get('/auth/logout')

    login(client, 'user@example.com', 'user123')
    resp = client.delete(f'/api/categories/{cat_id}')
    assert resp.status_code == 403
