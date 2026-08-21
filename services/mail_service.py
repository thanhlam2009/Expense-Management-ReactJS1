# -*- coding: utf-8 -*-
"""
Mail Service - Gửi email xác thực đăng ký qua Flask-Mail (SMTP Gmail).
"""

import threading
from flask import current_app
from flask_mail import Message
from app import mail


def send_verification_email(user, code):
    """Gửi mã OTP xác thực email tới hộp thư của user (đồng bộ, có thể mất vài giây)."""
    msg = Message(
        subject='Mã xác thực tài khoản - Quản lý Chi tiêu',
        recipients=[user.email],
        body=(
            f'Xin chào {user.full_name},\n\n'
            f'Mã xác thực email của bạn là: {code}\n'
            f'Mã có hiệu lực trong 15 phút.\n\n'
            f'Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.'
        ),
    )
    mail.send(msg)


def send_verification_email_async(user, code):
    """Gửi mã OTP ở luồng nền, không chặn response của request đang xử lý.

    Kết nối SMTP có thể chậm/treo trên môi trường hosting free tier (Render...),
    đủ để vượt quá thời gian chờ của proxy và khiến cả request bị timeout dù
    tài khoản đã được tạo thành công trong DB. Chạy nền để request luôn trả
    lời nhanh, bất kể việc gửi mail thật sự mất bao lâu.
    """
    app = current_app._get_current_object()

    def _send():
        with app.app_context():
            try:
                send_verification_email(user, code)
            except Exception:
                app.logger.exception('Gửi email xác thực thất bại cho %s', user.email)

    threading.Thread(target=_send, daemon=True).start()
