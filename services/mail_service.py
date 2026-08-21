# -*- coding: utf-8 -*-
"""
Mail Service - Gửi email xác thực đăng ký qua Brevo HTTP API.

SMTP trực tiếp (port 587/465) bị chặn ở tầng mạng trên nhiều hosting free tier
(VD Render: "OSError: Network is unreachable"), nên phải gửi qua HTTP API
(port 443, cùng cổng app đang dùng để gọi Gemini/OpenAI) thay vì smtplib.
"""

import threading
import requests
from flask import current_app

BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'


def send_verification_email(user, code):
    """Gửi mã OTP xác thực email tới hộp thư của user qua Brevo API (đồng bộ)."""
    if current_app.config.get('MAIL_SUPPRESS_SEND'):
        return

    api_key = current_app.config.get('BREVO_API_KEY')
    sender_email = current_app.config.get('MAIL_SENDER_EMAIL')
    if not api_key or not sender_email:
        raise RuntimeError('Chưa cấu hình BREVO_API_KEY / MAIL_SENDER_EMAIL')

    payload = {
        'sender': {
            'name': current_app.config.get('MAIL_SENDER_NAME', 'Quản lý Chi tiêu'),
            'email': sender_email
        },
        'to': [{'email': user.email, 'name': user.full_name}],
        'subject': 'Mã xác thực tài khoản - Quản lý Chi tiêu',
        'textContent': (
            f'Xin chào {user.full_name},\n\n'
            f'Mã xác thực email của bạn là: {code}\n'
            f'Mã có hiệu lực trong 15 phút.\n\n'
            f'Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.'
        ),
    }
    headers = {
        'api-key': api_key,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }

    response = requests.post(BREVO_ENDPOINT, json=payload, headers=headers, timeout=15)
    if response.status_code >= 300:
        raise RuntimeError(f'Brevo API lỗi {response.status_code}: {response.text}')


def send_verification_email_async(user, code):
    """Gửi mã OTP ở luồng nền, không chặn response của request đang xử lý."""
    app = current_app._get_current_object()

    def _send():
        with app.app_context():
            try:
                send_verification_email(user, code)
            except Exception:
                app.logger.exception('Gửi email xác thực thất bại cho %s', user.email)

    threading.Thread(target=_send, daemon=True).start()
