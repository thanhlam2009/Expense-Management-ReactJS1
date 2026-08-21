import random
from app import db, login_manager, bcrypt
from flask_login import UserMixin
from datetime import datetime, timedelta

VERIFICATION_CODE_TTL_MINUTES = 15

@login_manager.user_loader
def load_user(user_id):
    user = User.query.get(int(user_id))
    if user and not user.is_active:
        return None
    return user

class User(UserMixin, db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(60), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    verification_code = db.Column(db.String(6))
    verification_code_expires = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    # Relationships
    transactions = db.relationship('Transaction', backref='user', lazy=True)
    savings_goals = db.relationship('SavingsGoal', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def update_last_login(self):
        self.last_login = datetime.utcnow()
        db.session.commit()

    def generate_verification_code(self):
        """Sinh mã OTP 6 số, lưu kèm hạn dùng, trả về mã để gửi email."""
        code = f'{random.randint(0, 999999):06d}'
        self.verification_code = code
        self.verification_code_expires = datetime.utcnow() + timedelta(minutes=VERIFICATION_CODE_TTL_MINUTES)
        db.session.commit()
        return code

    def verify_code(self, code):
        """Kiểm tra mã OTP; nếu đúng và còn hạn thì đánh dấu đã xác thực."""
        if not self.verification_code or self.verification_code != code:
            return False
        if not self.verification_code_expires or datetime.utcnow() > self.verification_code_expires:
            return False
        self.is_verified = True
        self.verification_code = None
        self.verification_code_expires = None
        db.session.commit()
        return True

    def __repr__(self):
        return f'<User {self.email}>'

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'is_admin': self.is_admin,
            'is_verified': self.is_verified,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None
        }