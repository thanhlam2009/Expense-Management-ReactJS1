# -*- coding: utf-8 -*-
"""
Cấu hình chung cho pytest: khởi tạo Flask app ở chế độ testing (SQLite in-memory),
cung cấp test client và các helper đăng nhập.
"""
import os
import sys

# Đưa thư mục gốc dự án vào sys.path để import được app/, models/, routes/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from app import create_app, db as _db


@pytest.fixture()
def app():
    """Tạo mới một app testing cho mỗi test (DB in-memory, seed sẵn admin/user + dữ liệu mẫu)."""
    app = create_app('testing')
    # Test client chạy trên http:// nên phải tắt Secure cookie, nếu không session sẽ không được lưu
    app.config['SESSION_COOKIE_SECURE'] = False
    app.config['REMEMBER_COOKIE_SECURE'] = False
    yield app
    # Dọn dẹp: xóa toàn bộ bảng của DB in-memory
    with app.app_context():
        _db.session.remove()
        _db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


# ---- Helpers ----
def login(client, email, password):
    """Đăng nhập bằng JSON, trả về response."""
    return client.post('/auth/login', json={'email': email, 'password': password})


@pytest.fixture()
def admin_client(client):
    """Test client đã đăng nhập bằng tài khoản admin mẫu (được seed sẵn)."""
    resp = login(client, 'admin@example.com', 'admin123')
    assert resp.status_code == 200
    return client


@pytest.fixture()
def user_client(client):
    """Test client đã đăng nhập bằng tài khoản người dùng thường mẫu."""
    resp = login(client, 'user@example.com', 'user123')
    assert resp.status_code == 200
    return client
