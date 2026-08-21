# -*- coding: utf-8 -*-
"""
Initialize sample data for Expense Tracker
Run this script to create sample users and transactions for testing
"""

import os
import sys
from datetime import datetime, timedelta
import random

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from models.user import User
from models.category import Category
from models.transaction import Transaction
from models.savings_goal import SavingsGoal

def create_sample_data():
    app = create_app()
    
    with app.app_context():
        print("Creating sample data...")
        
        # Create sample user (if not exists)
        user = User.query.filter_by(email='user@example.com').first()
        if not user:
            user = User(
                email='user@example.com',
                full_name='Người dùng Demo',
                is_admin=False,
                is_verified=True
            )
            user.set_password('user123')
            db.session.add(user)
            print("✓ Created sample user: user@example.com / user123")
        
        db.session.commit()
        
        # Get categories
        income_categories = Category.query.filter_by(type='income').all()
        expense_categories = Category.query.filter_by(type='expense').all()
        
        # Create sample transactions
        transactions_count = Transaction.query.filter_by(user_id=user.id).count()
        if transactions_count < 50:
            print("Creating sample transactions...")
            
            # Sample income amounts
            income_amounts = [5000000, 7000000, 8000000, 10000000, 12000000, 15000000]
            
            # Sample expense amounts
            expense_amounts = [
                50000, 100000, 150000, 200000, 300000, 500000, 
                800000, 1000000, 1500000, 2000000, 3000000
            ]
            
            # Create transactions for the last 6 months
            for i in range(60):
                # Random date in the last 6 months
                days_ago = random.randint(0, 180)
                transaction_date = datetime.now().date() - timedelta(days=days_ago)
                
                # 70% chance for expense, 30% for income
                if random.random() < 0.7:
                    # Expense transaction
                    transaction_type = 'expense'
                    categories = expense_categories
                    amount = random.choice(expense_amounts)
                    descriptions = [
                        'Mua sắm hàng ngày',
                        'Ăn uống với bạn bè',
                        'Đi lại bằng xe buýt',
                        'Mua sách và dụng cụ học tập',
                        'Chi phí y tế',
                        'Giải trí cuối tuần',
                        'Mua quần áo',
                        'Thanh toán hóa đơn điện nước',
                        'Đổ xăng xe máy',
                        'Mua đồ điện tử'
                    ]
                else:
                    # Income transaction
                    transaction_type = 'income'
                    categories = income_categories
                    amount = random.choice(income_amounts)
                    descriptions = [
                        'Lương tháng',
                        'Thưởng hiệu suất',
                        'Thu nhập từ dạy thêm',
                        'Bán đồ cũ',
                        'Tiền lãi ngân hàng',
                        'Thu nhập từ đầu tư',
                        'Thưởng lễ tết',
                        'Thu nhập từ freelance'
                    ]
                
                if categories:
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
            
            print("✓ Created sample transactions")
        
        # Create sample savings goals
        goals_count = SavingsGoal.query.filter_by(user_id=user.id).count()
        if goals_count == 0:
            print("Creating sample savings goals...")
            
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
                    user_id=user.id,
                    is_active=True
                )
                db.session.add(goal)
            
            print("✓ Created sample savings goals")
        
        db.session.commit()
        print("\n🎉 Sample data created successfully!")
        print("\nLogin credentials:")
        print("- Admin: admin@example.com / admin123")
        print("- User: user@example.com / user123")
        print("\nStart the application with: python run.py")

if __name__ == '__main__':
    create_sample_data()