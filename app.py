from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from flask_wtf.csrf import CSRFProtect
from flask_cors import CORS
from flasgger import Swagger
from config import config
import os
from datetime import datetime

db = SQLAlchemy()
login_manager = LoginManager()
bcrypt = Bcrypt()
csrf = CSRFProtect()

SWAGGER_TEMPLATE = {
    "swagger": "2.0",
    "info": {
        "title": "Expense Management API",
        "description": (
            "Tài liệu API của hệ thống Quản lý Chi tiêu Cá nhân. "
            "Xác thực bằng session cookie (Flask-Login): gọi POST /auth/login trước, "
            "sau đó các endpoint yêu cầu đăng nhập sẽ dùng chung cookie phiên của trình duyệt."
        ),
        "version": "1.0.0",
    },
    "tags": [
        {"name": "Auth", "description": "Đăng ký, đăng nhập, đăng xuất, phiên đăng nhập"},
        {"name": "Transactions", "description": "CRUD giao dịch thu/chi"},
        {"name": "Categories", "description": "Danh mục thu nhập / chi tiêu"},
        {"name": "Dashboard & Stats", "description": "Thống kê, biểu đồ, dữ liệu tổng hợp"},
        {"name": "Savings Goals", "description": "Mục tiêu tiết kiệm"},
        {"name": "Budget", "description": "Giới hạn chi tiêu tháng và cảnh báo"},
        {"name": "Predictions", "description": "Dự đoán chi tiêu bằng thống kê/ML"},
        {"name": "Receipt OCR", "description": "Trích xuất thông tin hóa đơn bằng AI"},
        {"name": "Admin", "description": "Quản trị hệ thống (yêu cầu quyền admin)"},
        {"name": "Export", "description": "Xuất báo cáo"},
    ],
}

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [{"endpoint": "apispec", "route": "/apispec.json", "rule_filter": lambda rule: True, "model_filter": lambda tag: True}],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/apidocs/",
}

def create_app(config_name=None):
    app = Flask(__name__)
    
    # Load configuration
    config_name = config_name or os.environ.get('FLASK_CONFIG', 'development')
    app.config.from_object(config[config_name])
    
    app.config['SESSION_COOKIE_SAMESITE'] = 'None'
    app.config['SESSION_COOKIE_SECURE'] = True

    app.config['REMEMBER_COOKIE_SAMESITE'] = 'None'
    app.config['REMEMBER_COOKIE_SECURE'] = True

    
    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    bcrypt.init_app(app)
    csrf.init_app(app)
    Swagger(app, template=SWAGGER_TEMPLATE, config=SWAGGER_CONFIG)
    
    # Configure CORS for React development
    CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:5173",
            "http://localhost:3000",
            "https://expense-management-reactjs1-frontend.onrender.com"
        ],
        "supports_credentials": True,
        "allow_headers": ["Content-Type", "Authorization"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
})
    
    # Configure login manager
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Vui lòng đăng nhập để truy cập trang này.'
    login_manager.login_message_category = 'info'
    @login_manager.user_loader
    def load_user(user_id):
        from models.user import User
        return User.query.get(int(user_id))
    
    # Import and register blueprints
    from routes.auth import auth_bp
    from routes.main import main_bp
    from routes.transactions import transactions_bp
    from routes.api import api_bp
    from routes.admin import admin_bp
    from routes.budget import budget_bp
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(main_bp)
    app.register_blueprint(transactions_bp, url_prefix='/transactions')
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Disable CSRF for API routes
    csrf.exempt(api_bp)
    # Also exempt auth blueprint for JSON requests (React app)
    csrf.exempt(auth_bp)
    # Exempt transactions blueprint for file uploads
    csrf.exempt(transactions_bp)
    # Exempt budget blueprint for JSON requests (React app)
    csrf.exempt(budget_bp)

    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(budget_bp)
    
    # Create database tables
    with app.app_context():
        db.create_all()
        
        # Create default categories if they don't exist
        from models.category import Category
        from models.user import User
        from models.transaction import Transaction
        from models.savings_goal import SavingsGoal
        import random
        from datetime import timedelta
        
        # Create admin user if doesn't exist
        admin = User.query.filter_by(email='admin@example.com').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@example.com',
                full_name='Administrator',
                is_admin=True
            )
            admin.set_password('admin123')
            db.session.add(admin)
        
        # Create sample user if doesn't exist
        user = User.query.filter_by(email='user@example.com').first()
        if not user:
            user = User(
                username='user',
                email='user@example.com',
                full_name='Người dùng Demo',
                is_admin=False
            )
            user.set_password('user123')
            db.session.add(user)
        
        # Create default categories
        for cat_name in app.config['DEFAULT_INCOME_CATEGORIES']:
            if not Category.query.filter_by(name=cat_name, type='income').first():
                category = Category(name=cat_name, type='income')
                db.session.add(category)
        
        for cat_name in app.config['DEFAULT_EXPENSE_CATEGORIES']:
            if not Category.query.filter_by(name=cat_name, type='expense').first():
                category = Category(name=cat_name, type='expense')
                db.session.add(category)
        
        db.session.commit()
        
        # Create sample data for both admin and demo users
        users_to_init = [
            User.query.filter_by(email='admin@example.com').first(),
            User.query.filter_by(email='user@example.com').first()
        ]
        
        for user in users_to_init:
            if user:
                # Create sample transactions if user has no transactions
                transactions_count = Transaction.query.filter_by(user_id=user.id).count()
                if transactions_count == 0:
                    # Get categories for sample data
                    income_categories = Category.query.filter_by(type='income').all()
                    expense_categories = Category.query.filter_by(type='expense').all()
                    
                    if income_categories and expense_categories:
                        # Sample amounts
                        income_amounts = [5000000, 7000000, 8000000, 10000000, 12000000, 15000000]
                        expense_amounts = [50000, 100000, 150000, 200000, 300000, 500000, 800000, 1000000, 1500000, 2000000, 3000000]
                        
                        # Sample descriptions
                        income_descriptions = ['Lương tháng', 'Thưởng hiệu suất', 'Thu nhập từ dạy thêm', 'Bán đồ cũ', 'Tiền lãi ngân hàng', 'Thu nhập từ đầu tư', 'Thưởng lễ tết', 'Thu nhập từ freelance']
                        expense_descriptions = ['Mua sắm hàng ngày', 'Ăn uống với bạn bè', 'Đi lại bằng xe buýt', 'Mua sách và dụng cụ học tập', 'Chi phí y tế', 'Giải trí cuối tuần', 'Mua quần áo', 'Thanh toán hóa đơn điện nước', 'Đổ xăng xe máy', 'Mua đồ điện tử']
                        
                        # Create 30 sample transactions for the last 3 months
                        for i in range(30):
                            days_ago = random.randint(0, 90)
                            transaction_date = datetime.now().date() - timedelta(days=days_ago)
                            
                            # 70% expense, 30% income
                            if random.random() < 0.7:
                                transaction_type = 'expense'
                                categories = expense_categories
                                amount = random.choice(expense_amounts)
                                descriptions = expense_descriptions
                            else:
                                transaction_type = 'income'
                                categories = income_categories
                                amount = random.choice(income_amounts)
                                descriptions = income_descriptions
                            
                            category = random.choice(categories)
                            description = random.choice(descriptions)
                            
                            transaction = Transaction(
                                amount=amount,
                                type=transaction_type,
                                category_id=category.id,
                                description=description,
                                date=transaction_date,
                                user_id=user.id
                            )
                            db.session.add(transaction)
            
                # Create sample savings goals if user has none
                goals_count = SavingsGoal.query.filter_by(user_id=user.id).count()
                if goals_count == 0:
                    goals_data = [
                        {
                            'name': 'Mua xe máy mới',
                            'target_amount': 50000000,
                            'current_amount': 15000000,
                            'description': 'Tiết kiệm để mua chiếc xe máy Honda mới',
                            'target_date': datetime.now().date() + timedelta(days=365)
                        },
                        {
                            'name': 'Du lịch Đà Lạt',
                            'target_amount': 5000000,
                            'current_amount': 3500000,
                            'description': 'Chuyến du lịch gia đình cuối năm',
                            'target_date': datetime.now().date() + timedelta(days=90)
                        },
                        {
                            'name': 'Dự phòng khẩn cấp',
                            'target_amount': 30000000,
                            'current_amount': 8000000,
                            'description': 'Quỹ dự phòng cho các tình huống khẩn cấp',
                            'target_date': None
                        }
                    ]
                    
                    for goal_data in goals_data:
                        goal = SavingsGoal(
                            name=goal_data['name'],
                            target_amount=goal_data['target_amount'],
                            current_amount=goal_data['current_amount'],
                            description=goal_data['description'],
                            target_date=goal_data['target_date'],
                            user_id=user.id
                        )
                        db.session.add(goal)
        
        db.session.commit()
    
    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        app.run(debug=True)