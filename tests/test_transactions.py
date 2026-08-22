# -*- coding: utf-8 -*-
"""
TC-03: Kiểm thử CRUD Giao dịch và cô lập dữ liệu giữa các người dùng (IDOR).
"""
import os
import pytest
from datetime import date
from tests.conftest import login


def _first_category_id(client):
    """Lấy id của một danh mục hợp lệ (được seed sẵn)."""
    cats = client.get('/api/categories').get_json()
    assert len(cats) > 0
    return cats[0]['id']


@pytest.fixture()
def uploaded_receipt(app):
    """Giả lập một ảnh hóa đơn đã được lưu sẵn trong UPLOAD_FOLDER (như sau khi OCR xử lý xong)."""
    with app.app_context():
        upload_dir = app.config['UPLOAD_FOLDER']
        os.makedirs(upload_dir, exist_ok=True)
        filename = 'test_receipt.jpg'
        path = os.path.join(upload_dir, filename)
        with open(path, 'wb') as f:
            f.write(b'fake-image-bytes')
    yield filename
    if os.path.exists(path):
        os.remove(path)


def test_create_transaction(user_client):
    cat_id = _first_category_id(user_client)
    resp = user_client.post('/api/transactions', json={
        'amount': 123000,
        'type': 'expense',
        'category_id': cat_id,
        'description': 'Test tạo giao dịch',
        'date': date.today().isoformat(),
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['amount'] == 123000
    assert data['type'] == 'expense'
    assert data['id'] is not None


def test_get_transaction(user_client):
    cat_id = _first_category_id(user_client)
    created = user_client.post('/api/transactions', json={
        'amount': 50000, 'type': 'expense', 'category_id': cat_id,
        'description': 'GD để đọc', 'date': date.today().isoformat(),
    }).get_json()
    resp = user_client.get(f"/api/transactions/{created['id']}")
    assert resp.status_code == 200
    assert resp.get_json()['id'] == created['id']


def test_update_transaction(user_client):
    cat_id = _first_category_id(user_client)
    created = user_client.post('/api/transactions', json={
        'amount': 50000, 'type': 'expense', 'category_id': cat_id,
        'description': 'Trước sửa', 'date': date.today().isoformat(),
    }).get_json()
    resp = user_client.put(f"/api/transactions/{created['id']}", json={
        'amount': 99000, 'type': 'income', 'category_id': cat_id,
        'description': 'Sau sửa', 'date': date.today().isoformat(),
    })
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['amount'] == 99000
    assert data['type'] == 'income'
    assert data['description'] == 'Sau sửa'


def test_delete_transaction(user_client):
    cat_id = _first_category_id(user_client)
    created = user_client.post('/api/transactions', json={
        'amount': 50000, 'type': 'expense', 'category_id': cat_id,
        'description': 'Sẽ bị xóa', 'date': date.today().isoformat(),
    }).get_json()
    assert user_client.delete(f"/api/transactions/{created['id']}").status_code == 204
    # Sau khi xóa thì không đọc lại được nữa
    assert user_client.get(f"/api/transactions/{created['id']}").status_code == 404


def test_transaction_user_isolation(client):
    """
    Người dùng A không được truy cập giao dịch của người dùng B (chống lỗ hổng IDOR).
    Tạo giao dịch bằng tài khoản 'user', sau đó đăng nhập 'admin' và thử đọc -> 404.
    """
    # Đăng nhập user, tạo giao dịch
    login(client, 'user@example.com', 'user123')
    cat_id = _first_category_id(client)
    created = client.post('/api/transactions', json={
        'amount': 77000, 'type': 'expense', 'category_id': cat_id,
        'description': 'Riêng của user', 'date': date.today().isoformat(),
    }).get_json()
    client.get('/auth/logout')

    # Đăng nhập admin (một user khác), thử đọc giao dịch của user
    login(client, 'admin@example.com', 'admin123')
    resp = client.get(f"/api/transactions/{created['id']}")
    assert resp.status_code == 404


def test_list_transactions_requires_login(client):
    assert client.get('/api/transactions').status_code in (301, 302, 401)


def test_create_transaction_with_existing_receipt_image(user_client, uploaded_receipt):
    cat_id = _first_category_id(user_client)
    resp = user_client.post('/api/transactions', json={
        'amount': 45000, 'type': 'expense', 'category_id': cat_id,
        'description': 'Có ảnh hóa đơn', 'date': date.today().isoformat(),
        'receipt_image': uploaded_receipt,
    })
    assert resp.status_code == 201
    assert resp.get_json()['receipt_image'] == uploaded_receipt


def test_create_transaction_ignores_nonexistent_receipt_image(user_client):
    """Client tự gửi tên file không tồn tại trên server -> bị bỏ qua, không lưu bừa."""
    cat_id = _first_category_id(user_client)
    resp = user_client.post('/api/transactions', json={
        'amount': 45000, 'type': 'expense', 'category_id': cat_id,
        'description': 'Ảnh không có thật', 'date': date.today().isoformat(),
        'receipt_image': '../../etc/passwd',
    })
    assert resp.status_code == 201
    assert resp.get_json()['receipt_image'] is None


def test_update_transaction_without_receipt_image_keeps_existing(user_client, uploaded_receipt):
    cat_id = _first_category_id(user_client)
    created = user_client.post('/api/transactions', json={
        'amount': 50000, 'type': 'expense', 'category_id': cat_id,
        'description': 'GD có ảnh', 'date': date.today().isoformat(),
        'receipt_image': uploaded_receipt,
    }).get_json()
    assert created['receipt_image'] == uploaded_receipt

    resp = user_client.put(f"/api/transactions/{created['id']}", json={
        'amount': 60000, 'type': 'expense', 'category_id': cat_id,
        'description': 'Sửa nhưng không đụng ảnh', 'date': date.today().isoformat(),
    })
    assert resp.status_code == 200
    assert resp.get_json()['receipt_image'] == uploaded_receipt
