# -*- coding: utf-8 -*-
"""
Mail Service - Gửi email xác thực đăng ký qua Flask-Mail (SMTP Gmail).
"""

from flask_mail import Message
from app import mail


def send_verification_email(user, code):
    """Gửi mã OTP xác thực email tới hộp thư của user."""
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
