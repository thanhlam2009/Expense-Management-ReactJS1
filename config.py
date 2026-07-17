import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///expense_tracker.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Upload folder for receipts/images
    UPLOAD_FOLDER = 'static/uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # Session configuration
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    
    # OCR configuration
    TESSERACT_CMD = r'C:\Program Files\Tesseract-OCR\tesseract.exe'  # Windows path
    
    # OCR Provider: 'gemini' or 'openai'
    OCR_PROVIDER = os.environ.get('OCR_PROVIDER', 'gemini')
    
    # Google Gemini Configuration (Recommended - Free tier available)
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
    
    # OpenAI Configuration (Optional - Paid only)
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    OPENAI_MODEL = 'gpt-4o'
    
    # Chart colors
    CHART_COLORS = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#FF6384', '#36A2EB'
    ]
    
    # Default categories
    DEFAULT_INCOME_CATEGORIES = [
        'Lương', 'Thưởng', 'Đầu tư', 'Kinh doanh', 'Khác'
    ]
    
    DEFAULT_EXPENSE_CATEGORIES = [
        'Ăn uống', 'Đi lại', 'Giải trí', 'Mua sắm', 'Y tế',
        'Học tập', 'Nhà ở', 'Điện nước', 'Bảo hiểm', 'Khác'
    ]

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

class TestingConfig(Config):
    """Cấu hình dành cho pytest: dùng SQLite in-memory, cô lập hoàn toàn khỏi DB thật."""
    from sqlalchemy.pool import StaticPool
    TESTING = True
    DEBUG = False
    # In-memory DB; StaticPool giữ 1 kết nối duy nhất để dữ liệu tồn tại xuyên suốt các request trong 1 test
    SQLALCHEMY_DATABASE_URI = 'sqlite://'
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {'check_same_thread': False},
        'poolclass': StaticPool,
    }
    WTF_CSRF_ENABLED = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}