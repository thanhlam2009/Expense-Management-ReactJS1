# -*- coding: utf-8 -*-
"""
Budget Management Routes
API endpoints cho quản lý giới hạn chi tiêu và cảnh báo
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import func, extract
from app import db
from models import MonthlyBudget, Transaction

budget_bp = Blueprint('budget', __name__)

@budget_bp.route('/api/budget/current', methods=['GET'])
@login_required
def get_current_budget():
    """Lấy thông tin ngân sách tháng hiện tại
    ---
    tags:
      - Budget
    responses:
      200:
        description: Giới hạn chi tiêu, chi tiêu hiện tại, % đã dùng và mức cảnh báo
    """
    try:
        from models import Transaction
        
        budget = MonthlyBudget.get_current_month_budget(current_user.id)
        
        if not budget:
            return jsonify({
                'budget_limit': 0,
                'current_spending': 0,
                'spending_percentage': 0,
                'remaining_budget': 0,
                'alert_level': 'Chưa đặt giới hạn',
                'alert_color': 'secondary'
            })
        
        # Calculate current spending
        now = datetime.now()
        current_spending = db.session.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.type == 'expense',
            extract('year', Transaction.date) == now.year,
            extract('month', Transaction.date) == now.month
        ).scalar() or 0
        
        spending_percentage = (float(current_spending) / float(budget.budget_limit) * 100) if budget.budget_limit > 0 else 0
        remaining_budget = float(budget.budget_limit) - float(current_spending)
        
        # Determine alert level and color
        if spending_percentage >= 100:
            alert_level = 'Vượt quá giới hạn'
            alert_color = 'danger'
        elif spending_percentage >= 95:
            alert_level = 'Nguy hiểm'
            alert_color = 'danger'
        elif spending_percentage >= 80:
            alert_level = 'Cảnh báo'
            alert_color = 'warning'
        elif spending_percentage >= 70:
            alert_level = 'Chú ý'
            alert_color = 'info'
        else:
            alert_level = 'An toàn'
            alert_color = 'success'
        
        return jsonify({
            'budget_limit': float(budget.budget_limit),
            'current_spending': float(current_spending),
            'spending_percentage': round(spending_percentage, 1),
            'remaining_budget': remaining_budget,
            'alert_level': alert_level,
            'alert_color': alert_color
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi khi lấy thông tin budget: {str(e)}'
        }), 500

@budget_bp.route('/api/budget/set', methods=['POST'])
@login_required
def set_monthly_budget():
    """Đặt giới hạn chi tiêu cho tháng hiện tại
    ---
    tags:
      - Budget
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [budget_limit]
          properties:
            budget_limit:
              type: number
              example: 5000000
    responses:
      200:
        description: Đã cập nhật giới hạn chi tiêu thành công
      400:
        description: Giới hạn chi tiêu phải lớn hơn 0
    """
    try:
        data = request.get_json() or {}
        budget_limit = float(data.get('budget_limit', 0))

        if budget_limit <= 0:
            return jsonify({
                'success': False,
                'message': 'Giới hạn chi tiêu phải lớn hơn 0'
            }), 400
        
        now = datetime.now()
        
        # Tìm budget hiện tại hoặc tạo mới
        budget = MonthlyBudget.query.filter_by(
            user_id=current_user.id,
            year=now.year,
            month=now.month
        ).first()
        
        if budget:
            budget.budget_limit = budget_limit
            budget.updated_at = datetime.utcnow()
        else:
            budget = MonthlyBudget(
                user_id=current_user.id,
                year=now.year,
                month=now.month,
                budget_limit=budget_limit
            )
            db.session.add(budget)
        
        db.session.commit()

        return jsonify({
            'success': True,
            'budget': budget.to_dict(),
            'message': 'Đã cập nhật giới hạn chi tiêu thành công'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Lỗi khi cập nhật budget: {str(e)}'
        }), 500

@budget_bp.route('/api/budget/alert', methods=['GET'])
@login_required
def get_budget_alert():
    """Lấy cảnh báo chi tiêu tháng hiện tại
    Trả về mức cảnh báo (an toàn/chú ý/cảnh báo/nguy hiểm/vượt giới hạn) theo % ngân sách đã dùng.
    ---
    tags:
      - Budget
    responses:
      200:
        description: Thông tin cảnh báo (alert=null nếu chưa đặt giới hạn ngân sách)
    """
    try:
        now = datetime.now()
        
        # Lấy budget tháng hiện tại
        budget = MonthlyBudget.get_current_month_budget(current_user.id)
        
        if not budget or budget.budget_limit <= 0:
            return jsonify({
                'success': True,
                'alert': None,
                'message': 'Chưa đặt giới hạn chi tiêu'
            })
        
        # Tính tổng chi tiêu tháng hiện tại
        current_spending = db.session.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.type == 'expense',
            extract('year', Transaction.date) == now.year,
            extract('month', Transaction.date) == now.month
        ).scalar() or 0
        
        # Tính phần trăm chi tiêu
        spending_percentage = (float(current_spending) / float(budget.budget_limit)) * 100
        
        # Xác định mức độ cảnh báo
        alert_level = 'safe'  # Mặc định an toàn
        alert_color = 'success'
        alert_message = 'Chi tiêu trong tầm kiểm soát'
        
        if spending_percentage >= 100:
            alert_level = 'danger'
            alert_color = 'danger'
            alert_message = 'Đã vượt quá giới hạn chi tiêu!'
        elif spending_percentage >= 95:
            alert_level = 'critical'
            alert_color = 'danger'
            alert_message = 'Sắp vượt quá giới hạn chi tiêu!'
        elif spending_percentage >= 80:  # Ngưỡng cảnh báo 80%
            alert_level = 'warning'
            alert_color = 'warning'
            alert_message = 'Đã chi tiêu gần đạt giới hạn tháng'
        elif spending_percentage >= 70:
            alert_level = 'info'
            alert_color = 'info'
            alert_message = 'Chi tiêu đang tăng, cần chú ý'
        
        return jsonify({
            'success': True,
            'alert': {
                'budget_limit': float(budget.budget_limit),
                'current_spending': float(current_spending),
                'remaining_budget': float(budget.budget_limit) - float(current_spending),
                'spending_percentage': round(spending_percentage, 1),
                'alert_level': alert_level,
                'alert_color': alert_color,
                'alert_message': alert_message,
                'show_alert': spending_percentage >= 80  # Chỉ hiển thị cảnh báo từ 80%
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi khi lấy thông tin cảnh báo: {str(e)}'
        }), 500

@budget_bp.route('/api/budget/test', methods=['GET'])
def test_budget():
    """Health-check của Budget API
    ---
    tags:
      - Budget
    responses:
      200:
        description: API đang hoạt động bình thường
    """
    return jsonify({
        'success': True,
        'message': 'Budget API hoạt động bình thường',
        'timestamp': datetime.now().isoformat()
    })
