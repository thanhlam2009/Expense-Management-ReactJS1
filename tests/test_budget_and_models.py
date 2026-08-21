# -*- coding: utf-8 -*-
"""
TC-05: Kiểm thử Ngân sách tháng.
TC-06: Kiểm thử white-box mức đơn vị cho model (băm mật khẩu bcrypt).
TC-07: Kiểm thử Danh mục.
"""
from models.user import User


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
