from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from models.transaction import Transaction
from models.category import Category
from models.savings_goal import SavingsGoal
from models.monthly_budget import MonthlyBudget
from models.user import User
from app import db
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from services.prediction_service import ExpensePredictionService
import calendar

api_bp = Blueprint('api', __name__)

@api_bp.route('/transactions', methods=['GET'])
@login_required
def get_transactions():
    """Lấy toàn bộ giao dịch (không phân trang)
    ---
    tags:
      - Transactions
    responses:
      200:
        description: Danh sách toàn bộ giao dịch của người dùng hiện tại
      302:
        description: Chưa đăng nhập
    """
    transactions = Transaction.query.filter_by(user_id=current_user.id).all()
    return jsonify([t.to_dict() for t in transactions])

@api_bp.route('/transactions/list', methods=['GET'])
@login_required
def get_transactions_list():
    """Lấy giao dịch có phân trang và bộ lọc
    ---
    tags:
      - Transactions
    parameters:
      - name: page
        in: query
        type: integer
        default: 1
      - name: per_page
        in: query
        type: integer
        default: 10
      - name: type
        in: query
        type: string
        enum: [income, expense]
      - name: category
        in: query
        type: integer
      - name: date_from
        in: query
        type: string
        format: date
      - name: date_to
        in: query
        type: string
        format: date
    responses:
      200:
        description: Danh sách giao dịch theo trang kèm thông tin phân trang và danh mục
    """
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    
    # Filters
    transaction_type = request.args.get('type')
    category_id = request.args.get('category')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    # Build query
    query = Transaction.query.filter_by(user_id=current_user.id)
    
    if transaction_type:
        query = query.filter_by(type=transaction_type)
    if category_id:
        query = query.filter_by(category_id=int(category_id))
    if date_from:
        query = query.filter(Transaction.date >= datetime.strptime(date_from, '%Y-%m-%d').date())
    if date_to:
        query = query.filter(Transaction.date <= datetime.strptime(date_to, '%Y-%m-%d').date())
    
    # Get paginated results
    pagination = query.order_by(Transaction.date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    # Get all categories for filter
    categories = Category.query.all()
    
    return jsonify({
        'transactions': [t.to_dict() for t in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev,
        'categories': [{'id': c.id, 'name': c.name, 'type': c.type} for c in categories]
    })

@api_bp.route('/transactions/recent', methods=['GET'])
@login_required
def get_recent_transactions():
    """Lấy các giao dịch gần đây nhất
    ---
    tags:
      - Transactions
    parameters:
      - name: limit
        in: query
        type: integer
        default: 5
    responses:
      200:
        description: Danh sách giao dịch gần đây, sắp xếp theo ngày giảm dần
    """
    limit = int(request.args.get('limit', 5))
    transactions = Transaction.query.filter_by(user_id=current_user.id).order_by(Transaction.date.desc()).limit(limit).all()
    return jsonify([t.to_dict() for t in transactions])

@api_bp.route('/transactions', methods=['POST'])
@login_required
def create_transaction():
    """Tạo giao dịch mới
    ---
    tags:
      - Transactions
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [amount, type, category_id, date]
          properties:
            amount:
              type: number
              example: 150000
            type:
              type: string
              enum: [income, expense]
              example: expense
            category_id:
              type: integer
              example: 1
            description:
              type: string
              example: Ăn trưa
            date:
              type: string
              format: date
              example: "2026-07-18"
    responses:
      201:
        description: Giao dịch đã được tạo
    """
    data = request.get_json()
    
    transaction = Transaction(
        amount=data['amount'],
        type=data['type'],
        category_id=data['category_id'],
        description=data.get('description', ''),
        date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
        user_id=current_user.id
    )
    
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify(transaction.to_dict()), 201

@api_bp.route('/transactions/<int:id>', methods=['GET'])
@login_required
def get_transaction(id):
    """Lấy chi tiết 1 giao dịch theo ID
    ---
    tags:
      - Transactions
    parameters:
      - name: id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Chi tiết giao dịch
      404:
        description: Không tìm thấy, hoặc giao dịch không thuộc về người dùng hiện tại
    """
    transaction = Transaction.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    return jsonify(transaction.to_dict())

@api_bp.route('/transactions/<int:id>', methods=['PUT'])
@login_required
def update_transaction(id):
    """Cập nhật giao dịch
    ---
    tags:
      - Transactions
    parameters:
      - name: id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [amount, type, category_id, date]
          properties:
            amount:
              type: number
            type:
              type: string
              enum: [income, expense]
            category_id:
              type: integer
            description:
              type: string
            date:
              type: string
              format: date
    responses:
      200:
        description: Giao dịch đã được cập nhật
      404:
        description: Không tìm thấy
    """
    transaction = Transaction.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    data = request.get_json()
    
    transaction.amount = data['amount']
    transaction.type = data['type']
    transaction.category_id = data['category_id']
    transaction.description = data.get('description', '')
    transaction.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    transaction.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify(transaction.to_dict())

@api_bp.route('/transactions/<int:id>', methods=['DELETE'])
@login_required
def delete_transaction(id):
    """Xóa giao dịch
    ---
    tags:
      - Transactions
    parameters:
      - name: id
        in: path
        type: integer
        required: true
    responses:
      204:
        description: Đã xóa thành công
      404:
        description: Không tìm thấy
    """
    transaction = Transaction.query.filter_by(id=id, user_id=current_user.id).first_or_404()

    db.session.delete(transaction)
    db.session.commit()

    return '', 204

@api_bp.route('/categories', methods=['GET', 'POST'])
@login_required
def categories():
    """Danh sách danh mục / Tạo danh mục mới
    ---
    tags:
      - Categories
    parameters:
      - name: body
        in: body
        required: false
        description: Chỉ áp dụng cho POST
        schema:
          type: object
          required: [name, type]
          properties:
            name:
              type: string
              example: Ăn uống
            type:
              type: string
              enum: [income, expense]
            description:
              type: string
    responses:
      200:
        description: (GET) Danh sách toàn bộ danh mục
      201:
        description: (POST) Danh mục đã được tạo
      400:
        description: (POST) Thiếu dữ liệu hoặc danh mục đã tồn tại
    """
    if request.method == 'POST':
        data = request.get_json()
        name = data.get('name')
        category_type = data.get('type')
        description = data.get('description', '')
        
        if not name or not category_type:
            return jsonify({'error': 'Tên và loại danh mục là bắt buộc'}), 400
        
        if Category.query.filter_by(name=name, type=category_type).first():
            return jsonify({'error': 'Danh mục đã tồn tại'}), 400
        
        category = Category(
            name=name,
            type=category_type,
            description=description
        )
        db.session.add(category)
        db.session.commit()
        return jsonify(category.to_dict()), 201
    
    # GET method
    categories = Category.query.all()
    return jsonify([c.to_dict() for c in categories])

@api_bp.route('/dashboard/data', methods=['GET'])
@login_required
def get_dashboard_data():
    """Lấy toàn bộ dữ liệu Dashboard trong 1 request
    Tổng thu/chi, số dư, dữ liệu tháng hiện tại, giao dịch gần đây, chi tiêu theo danh mục,
    mục tiêu tiết kiệm đang hoạt động và cảnh báo ngân sách (nếu có).
    ---
    tags:
      - Dashboard & Stats
    responses:
      200:
        description: Dữ liệu tổng hợp cho trang Dashboard
    """
    today = datetime.now().date()
    current_month = today.month
    current_year = today.year
    
    # Calculate date ranges
    month_start = today.replace(day=1)
    if current_month == 12:
        month_end = today.replace(year=current_year + 1, month=1, day=1) - timedelta(days=1)
    else:
        month_end = today.replace(month=current_month + 1, day=1) - timedelta(days=1)
    
    # Get user's transactions
    user_transactions = Transaction.query.filter_by(user_id=current_user.id)
    
    # Calculate totals
    total_income = user_transactions.filter_by(type='income').with_entities(func.sum(Transaction.amount)).scalar() or 0
    total_expense = user_transactions.filter_by(type='expense').with_entities(func.sum(Transaction.amount)).scalar() or 0
    balance = total_income - total_expense
    
    # Monthly totals
    monthly_income = user_transactions.filter(
        Transaction.type == 'income',
        Transaction.date >= month_start,
        Transaction.date <= month_end
    ).with_entities(func.sum(Transaction.amount)).scalar() or 0
    
    monthly_expense = user_transactions.filter(
        Transaction.type == 'expense',
        Transaction.date >= month_start,
        Transaction.date <= month_end
    ).with_entities(func.sum(Transaction.amount)).scalar() or 0
    
    # Recent transactions
    recent_transactions = user_transactions.order_by(Transaction.created_at.desc()).limit(5).all()
    
    # Category spending this month
    category_spending = db.session.query(
        Category.name,
        func.sum(Transaction.amount).label('total')
    ).join(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'expense',
        Transaction.date >= month_start,
        Transaction.date <= month_end
    ).group_by(Category.name).order_by(func.sum(Transaction.amount).desc()).limit(5).all()
    
    # Savings goals
    savings_goals = SavingsGoal.query.filter_by(user_id=current_user.id, is_active=True).all()
    
    # Budget Alert
    budget_alert = None
    current_budget = MonthlyBudget.get_current_month_budget(current_user.id)
    if current_budget and current_budget.budget_limit > 0:
        spending_percentage = (float(monthly_expense) / float(current_budget.budget_limit)) * 100
        
        if spending_percentage >= 70:
            if spending_percentage >= 100:
                alert_level = 'danger'
                alert_color = 'danger'
                alert_message = 'Đã vượt quá giới hạn chi tiêu!'
                alert_title = '🚨 Vượt Giới Hạn!'
            elif spending_percentage >= 95:
                alert_level = 'critical'
                alert_color = 'danger'
                alert_message = 'Sắp vượt quá giới hạn chi tiêu!'
                alert_title = '⚠️ Nguy Hiểm!'
            elif spending_percentage >= 80:
                alert_level = 'warning'
                alert_color = 'warning'
                alert_message = 'Đã chi tiêu gần đạt giới hạn tháng'
                alert_title = '⚡ Cảnh Báo!'
            else:
                alert_level = 'info'
                alert_color = 'info'
                alert_message = 'Chi tiêu đang tăng, cần chú ý'
                alert_title = '📊 Theo Dõi'
            
            budget_alert = {
                'budget_limit': float(current_budget.budget_limit),
                'current_spending': float(monthly_expense),
                'remaining_budget': float(current_budget.budget_limit) - float(monthly_expense),
                'spending_percentage': round(spending_percentage, 1),
                'alert_level': alert_level,
                'alert_color': alert_color,
                'alert_message': alert_message,
                'alert_title': alert_title,
                'show_alert': True
            }
    
    return jsonify({
        'total_income': float(total_income),
        'total_expense': float(total_expense),
        'balance': float(balance),
        'monthly_income': float(monthly_income),
        'monthly_expense': float(monthly_expense),
        'recent_transactions': [t.to_dict() for t in recent_transactions],
        'category_spending': [{'name': cat_name, 'total': float(total)} for cat_name, total in category_spending],
        'savings_goals': [g.to_dict() for g in savings_goals],
        'budget_alert': budget_alert
    })

@api_bp.route('/stats/overview', methods=['GET'])
@login_required
def get_overview_stats():
    """Thống kê tổng quan (tổng thu / tổng chi / số dư)
    ---
    tags:
      - Dashboard & Stats
    responses:
      200:
        description: Tổng thu nhập, tổng chi tiêu và số dư của toàn bộ lịch sử giao dịch
    """
    user_transactions = Transaction.query.filter_by(user_id=current_user.id)
    
    total_income = user_transactions.filter_by(type='income').with_entities(func.sum(Transaction.amount)).scalar() or 0
    total_expense = user_transactions.filter_by(type='expense').with_entities(func.sum(Transaction.amount)).scalar() or 0
    
    return jsonify({
        'total_income': float(total_income),
        'total_expense': float(total_expense),
        'balance': float(total_income - total_expense)
    })

@api_bp.route('/stats/monthly', methods=['GET'])
@login_required
def get_monthly_stats():
    """Thống kê thu/chi theo từng tháng (N tháng gần nhất)
    ---
    tags:
      - Dashboard & Stats
    parameters:
      - name: months
        in: query
        type: integer
        default: 6
        description: Số tháng gần nhất muốn lấy dữ liệu
    responses:
      200:
        description: Danh sách thu nhập/chi tiêu/số dư theo từng tháng
    """
    months = int(request.args.get('months', 6))
    today = datetime.now().date()
    
    monthly_data = []
    for i in range(months):
        target_date = today.replace(day=1) - timedelta(days=i*30)
        
        income = Transaction.query.filter(
            Transaction.user_id == current_user.id,
            Transaction.type == 'income',
            extract('month', Transaction.date) == target_date.month,
            extract('year', Transaction.date) == target_date.year
        ).with_entities(func.sum(Transaction.amount)).scalar() or 0
        
        expense = Transaction.query.filter(
            Transaction.user_id == current_user.id,
            Transaction.type == 'expense',
            extract('month', Transaction.date) == target_date.month,
            extract('year', Transaction.date) == target_date.year
        ).with_entities(func.sum(Transaction.amount)).scalar() or 0
        
        monthly_data.append({
            'month': f"{target_date.year}-{target_date.month:02d}",
            'month_name': calendar.month_name[target_date.month],
            'income': float(income),
            'expense': float(expense),
            'balance': float(income - expense)
        })
    
    monthly_data.reverse()
    return jsonify(monthly_data)

@api_bp.route('/stats/categories', methods=['GET'])
@login_required
def get_category_stats():
    """Thống kê chi tiêu/thu nhập theo danh mục
    ---
    tags:
      - Dashboard & Stats
    parameters:
      - name: type
        in: query
        type: string
        enum: [income, expense]
        default: expense
      - name: months
        in: query
        type: integer
        default: 1
        description: Số tháng gần nhất tính từ đầu tháng hiện tại
    responses:
      200:
        description: Danh sách tổng tiền và số lượng giao dịch theo từng danh mục
    """
    transaction_type = request.args.get('type', 'expense')
    months = int(request.args.get('months', 1))
    
    today = datetime.now().date()
    start_date = today.replace(day=1) - timedelta(days=(months-1)*30)
    
    category_stats = db.session.query(
        Category.name,
        func.sum(Transaction.amount).label('total'),
        func.count(Transaction.id).label('count')
    ).join(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == transaction_type,
        Transaction.date >= start_date
    ).group_by(Category.name).order_by(func.sum(Transaction.amount).desc()).all()
    
    return jsonify([{
        'category': stat.name,
        'total': float(stat.total),
        'count': stat.count
    } for stat in category_stats])

@api_bp.route('/savings-goals', methods=['GET'])
@login_required
def get_savings_goals():
    """Lấy danh sách mục tiêu tiết kiệm
    ---
    tags:
      - Savings Goals
    responses:
      200:
        description: Toàn bộ mục tiêu tiết kiệm của người dùng hiện tại
    """
    goals = SavingsGoal.query.filter_by(user_id=current_user.id).all()
    return jsonify([g.to_dict() for g in goals])

@api_bp.route('/savings-goals/<int:id>/add-money', methods=['POST'])
@login_required
def add_money_to_goal(id):
    """Nạp tiền vào một mục tiêu tiết kiệm
    Tạo thêm 1 giao dịch thu nhập tương ứng và cộng dồn vào current_amount của mục tiêu.
    ---
    tags:
      - Savings Goals
    parameters:
      - name: id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [amount]
          properties:
            amount:
              type: number
              example: 500000
            description:
              type: string
              example: Nạp tiền vào mục tiêu tiết kiệm
    responses:
      200:
        description: Đã nạp tiền thành công
      400:
        description: Số tiền phải lớn hơn 0
      404:
        description: Không tìm thấy mục tiêu tiết kiệm
    """
    try:
        data = request.get_json()
        amount = float(data.get('amount', 0))
        description = data.get('description', 'Nạp tiền vào mục tiêu tiết kiệm')
        
        if amount <= 0:
            return jsonify({'error': 'Số tiền phải lớn hơn 0'}), 400
        
        # Find the specific savings goal
        goal = SavingsGoal.query.filter_by(id=id, user_id=current_user.id).first()
        if not goal:
            return jsonify({'error': 'Không tìm thấy mục tiêu tiết kiệm'}), 404
        
        # Create a transaction record
        transaction = Transaction(
            amount=amount,
            type='income',
            category_id=1,  # Category "Lương" for income
            description=f"{description} - {goal.name}",
            date=datetime.now().date(),
            user_id=current_user.id
        )
        
        # Add money directly to this specific goal
        goal.current_amount += amount
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Đã thêm {amount:,.0f} ₫ vào mục tiêu "{goal.name}"',
            'goal': goal.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Error adding money to goal: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/savings-goals/<int:id>', methods=['DELETE'])
@login_required
def delete_savings_goal(id):
    """Xóa mục tiêu tiết kiệm
    ---
    tags:
      - Savings Goals
    parameters:
      - name: id
        in: path
        type: integer
        required: true
    responses:
      204:
        description: Đã xóa thành công
      404:
        description: Không tìm thấy
    """
    try:
        print(f"Delete request for goal ID: {id}, Current user ID: {current_user.id}")
        goal = SavingsGoal.query.filter_by(id=id, user_id=current_user.id).first()
        
        if not goal:
            print(f"Goal not found for user {current_user.id}")
            return jsonify({'error': 'Savings goal not found'}), 404
        
        print(f"Deleting goal: {goal.name}")
        db.session.delete(goal)
        db.session.commit()
        
        return '', 204
    except Exception as e:
        print(f"Error deleting savings goal: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/predict-spending', methods=['GET'])
@login_required
def predict_spending():
    """Dự đoán chi tiêu toàn diện
    Chạy cả 3 phương pháp (trung bình đơn giản, trung bình có trọng số, hồi quy tuyến tính)
    và tự chọn kết quả phù hợp nhất dựa trên hệ số R².
    ---
    tags:
      - Predictions
    responses:
      200:
        description: Kết quả dự đoán được đề xuất kèm chi tiết từng phương pháp
      400:
        description: Không đủ dữ liệu lịch sử để dự đoán
    """
    prediction = ExpensePredictionService.get_comprehensive_prediction(current_user.id)
    
    if not prediction:
        return jsonify({
            'error': 'Không đủ dữ liệu để dự đoán',
            'message': 'Cần ít nhất 1 tháng dữ liệu chi tiêu để thực hiện dự đoán'
        }), 400
    
    return jsonify(prediction)

@api_bp.route('/predict-spending/simple', methods=['GET'])
@login_required
def predict_spending_simple():
    """Dự đoán bằng trung bình cộng đơn giản
    ---
    tags:
      - Predictions
    parameters:
      - name: months
        in: query
        type: integer
        default: 3
    responses:
      200:
        description: Kết quả dự đoán
      400:
        description: Không đủ dữ liệu
    """
    months = int(request.args.get('months', 3))
    prediction = ExpensePredictionService.predict_next_month_simple_average(current_user.id, months)
    
    if not prediction:
        return jsonify({
            'error': 'Không đủ dữ liệu',
            'message': f'Cần ít nhất {months} tháng dữ liệu chi tiêu'
        }), 400
    
    return jsonify(prediction)

@api_bp.route('/predict-spending/weighted', methods=['GET'])
@login_required
def predict_spending_weighted():
    """Dự đoán bằng trung bình có trọng số
    Các tháng gần đây được đánh trọng số cao hơn.
    ---
    tags:
      - Predictions
    parameters:
      - name: months
        in: query
        type: integer
        default: 3
    responses:
      200:
        description: Kết quả dự đoán
      400:
        description: Không đủ dữ liệu
    """
    months = int(request.args.get('months', 3))
    prediction = ExpensePredictionService.predict_next_month_weighted_average(current_user.id, months)
    
    if not prediction:
        return jsonify({
            'error': 'Không đủ dữ liệu',
            'message': f'Cần ít nhất {months} tháng dữ liệu chi tiêu'
        }), 400
    
    return jsonify(prediction)

@api_bp.route('/predict-spending/trend', methods=['GET'])
@login_required
def predict_spending_trend():
    """Dự đoán bằng hồi quy tuyến tính (Linear Regression)
    Trả về thêm hệ số R² (mức độ tin cậy của xu hướng).
    ---
    tags:
      - Predictions
    parameters:
      - name: months
        in: query
        type: integer
        default: 6
    responses:
      200:
        description: Kết quả dự đoán kèm r_squared và trend_slope
      400:
        description: Không đủ dữ liệu
    """
    months = int(request.args.get('months', 6))
    prediction = ExpensePredictionService.predict_next_month_linear_regression(current_user.id, months)
    
    if not prediction:
        return jsonify({
            'error': 'Không đủ dữ liệu',
            'message': f'Cần ít nhất 3 tháng dữ liệu chi tiêu'
        }), 400
    
    return jsonify(prediction)

@api_bp.route('/predict-spending/categories', methods=['GET'])
@login_required
def predict_spending_by_categories():
    """Dự đoán chi tiêu theo từng danh mục
    ---
    tags:
      - Predictions
    parameters:
      - name: months
        in: query
        type: integer
        default: 3
    responses:
      200:
        description: Dự đoán chi tiêu trung bình cho mỗi danh mục dựa trên N tháng gần nhất
    """
    months = int(request.args.get('months', 3))
    predictions = ExpensePredictionService.get_category_predictions(current_user.id, months)
    
    return jsonify({
        'category_predictions': predictions,
        'months_analyzed': months,
        'total_predicted': sum(p['predicted_amount'] for p in predictions)
    })

@api_bp.route('/spending-suggestions', methods=['GET'])
@login_required
def get_spending_suggestions():
    """Gợi ý phân bổ chi tiêu theo quy tắc 50/30/20
    ---
    tags:
      - Predictions
    responses:
      200:
        description: Gợi ý phân bổ needs/wants/savings dựa trên thu nhập tháng hiện tại
    """
    # Get user's monthly income
    today = datetime.now().date()
    month_start = today.replace(day=1)
    
    monthly_income = Transaction.query.filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'income',
        Transaction.date >= month_start
    ).with_entities(func.sum(Transaction.amount)).scalar() or 0
    
    # Suggested budget allocation (50/30/20 rule)
    suggestions = {
        'needs': float(monthly_income * 0.5),  # Essential expenses
        'wants': float(monthly_income * 0.3),  # Entertainment, dining out
        'savings': float(monthly_income * 0.2), # Savings and investments
        'total_income': float(monthly_income)
    }
    
    return jsonify(suggestions)

@api_bp.route('/stats/all-months', methods=['GET'])
@login_required
def get_all_months_data():
    """Lấy dữ liệu thu/chi cho toàn bộ các tháng có giao dịch
    ---
    tags:
      - Dashboard & Stats
    responses:
      200:
        description: Danh sách dữ liệu theo từng tháng (từ tháng có giao dịch đầu tiên) kèm tổng kết
    """
    # Query all transactions grouped by month and year
    monthly_data = db.session.query(
        extract('year', Transaction.date).label('year'),
        extract('month', Transaction.date).label('month'),
        Transaction.type,
        func.sum(Transaction.amount).label('total_amount')
    ).filter(
        Transaction.user_id == current_user.id
    ).group_by(
        extract('year', Transaction.date),
        extract('month', Transaction.date),
        Transaction.type
    ).order_by(
        extract('year', Transaction.date),
        extract('month', Transaction.date)
    ).all()
    
    # Organize data by month
    months_dict = {}
    for row in monthly_data:
        month_key = f"{int(row.year)}-{int(row.month):02d}"
        if month_key not in months_dict:
            months_dict[month_key] = {
                'year': int(row.year),
                'month': int(row.month),
                'month_name': calendar.month_name[int(row.month)],
                'income': 0,
                'expense': 0,
                'balance': 0
            }
        
        if row.type == 'income':
            months_dict[month_key]['income'] = float(row.total_amount)
        else:
            months_dict[month_key]['expense'] = float(row.total_amount)
    
    # Calculate balance for each month
    result = []
    for month_key in sorted(months_dict.keys()):
        month_data = months_dict[month_key]
        month_data['balance'] = month_data['income'] - month_data['expense']
        result.append(month_data)
    
    return jsonify({
        'months_data': result,
        'total_months': len(result),
        'summary': {
            'total_income': sum(m['income'] for m in result),
            'total_expense': sum(m['expense'] for m in result),
            'total_balance': sum(m['balance'] for m in result)
        }
    })

# Savings Goals CRUD APIs
@api_bp.route('/savings-goals/<int:id>', methods=['GET'])
@login_required
def get_savings_goal(id):
    """Lấy chi tiết 1 mục tiêu tiết kiệm
    ---
    tags:
      - Savings Goals
    parameters:
      - name: id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Chi tiết mục tiêu tiết kiệm
      404:
        description: Không tìm thấy
    """
    goal = SavingsGoal.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    return jsonify(goal.to_dict())

@api_bp.route('/savings-goals', methods=['POST'])
@login_required
def create_savings_goal():
    """Tạo mục tiêu tiết kiệm mới
    ---
    tags:
      - Savings Goals
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [name, target_amount]
          properties:
            name:
              type: string
              example: Mua xe máy mới
            target_amount:
              type: number
              example: 50000000
            target_date:
              type: string
              format: date
            description:
              type: string
    responses:
      201:
        description: Mục tiêu đã được tạo
    """
    data = request.get_json()
    
    goal = SavingsGoal(
        name=data['name'],
        target_amount=float(data['target_amount']),
        target_date=datetime.strptime(data['target_date'], '%Y-%m-%d').date() if data.get('target_date') else None,
        description=data.get('description'),
        user_id=current_user.id
    )
    
    db.session.add(goal)
    db.session.commit()
    
    return jsonify(goal.to_dict()), 201

@api_bp.route('/savings-goals/<int:id>', methods=['PUT'])
@login_required
def update_savings_goal(id):
    """Cập nhật mục tiêu tiết kiệm
    ---
    tags:
      - Savings Goals
    parameters:
      - name: id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [name, target_amount]
          properties:
            name:
              type: string
            target_amount:
              type: number
            target_date:
              type: string
              format: date
            description:
              type: string
    responses:
      200:
        description: Mục tiêu đã được cập nhật
      404:
        description: Không tìm thấy
    """
    goal = SavingsGoal.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    data = request.get_json()
    
    goal.name = data['name']
    goal.target_amount = float(data['target_amount'])
    goal.target_date = datetime.strptime(data['target_date'], '%Y-%m-%d').date() if data.get('target_date') else None
    goal.description = data.get('description')
    
    db.session.commit()
    
    return jsonify(goal.to_dict())

# Admin APIs
@api_bp.route('/admin/stats', methods=['GET'])
@login_required
def get_admin_stats():
    """[Admin] Thống kê tổng quan toàn hệ thống
    ---
    tags:
      - Admin
    responses:
      200:
        description: Tổng số người dùng, giao dịch, thu/chi, người dùng mới nhất, top danh mục
      403:
        description: Không có quyền (không phải admin)
    """
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    total_users = User.query.count()
    total_transactions = Transaction.query.count()
    total_income = Transaction.query.filter_by(type='income').with_entities(func.sum(Transaction.amount)).scalar() or 0
    total_expense = Transaction.query.filter_by(type='expense').with_entities(func.sum(Transaction.amount)).scalar() or 0
    
    recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
    
    top_categories = db.session.query(
        Category.name,
        func.sum(Transaction.amount).label('total')
    ).join(Transaction).filter(
        Transaction.type == 'expense'
    ).group_by(Category.name).order_by(func.sum(Transaction.amount).desc()).limit(5).all()
    
    return jsonify({
        'total_users': total_users,
        'total_transactions': total_transactions,
        'total_income': float(total_income),
        'total_expense': float(total_expense),
        'recent_users': [u.to_dict() for u in recent_users],
        'top_categories': [[cat_name, float(total)] for cat_name, total in top_categories]
    })

@api_bp.route('/admin/users', methods=['GET'])
@login_required
def get_admin_users():
    """[Admin] Danh sách toàn bộ người dùng
    ---
    tags:
      - Admin
    responses:
      200:
        description: Danh sách người dùng trong hệ thống
      403:
        description: Không có quyền
    """
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({
        'users': [u.to_dict() for u in users],
        'current_user_id': current_user.id
    })

@api_bp.route('/admin/categories', methods=['GET'])
@login_required
def get_admin_categories():
    """[Admin] Danh sách danh mục kèm số lượng giao dịch
    ---
    tags:
      - Admin
    responses:
      200:
        description: Danh sách danh mục, mỗi danh mục kèm transaction_count
      403:
        description: Không có quyền
    """
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    categories = Category.query.order_by(Category.type, Category.name).all()
    result = []
    for cat in categories:
        cat_dict = cat.to_dict()
        cat_dict['transaction_count'] = Transaction.query.filter_by(category_id=cat.id).count()
        result.append(cat_dict)
    
    return jsonify(result)

@api_bp.route('/admin/transactions', methods=['GET'])
@login_required
def get_admin_transactions():
    """[Admin] Toàn bộ giao dịch của mọi người dùng
    ---
    tags:
      - Admin
    responses:
      200:
        description: Danh sách toàn bộ giao dịch trong hệ thống
      403:
        description: Không có quyền
    """
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    transactions = Transaction.query.order_by(Transaction.date.desc()).all()
    return jsonify([t.to_dict() for t in transactions])

@api_bp.route('/admin/recent-users', methods=['GET'])
@login_required
def get_recent_users():
    """[Admin] 5 người dùng đăng ký gần đây nhất
    ---
    tags:
      - Admin
    responses:
      200:
        description: Danh sách 5 người dùng mới nhất
      403:
        description: Không có quyền
    """
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    users = User.query.order_by(User.created_at.desc()).limit(5).all()
    return jsonify({
        'users': [{
            'id': u.id,
            'email': u.email,
            'full_name': u.full_name,
            'is_admin': u.is_admin,
            'created_at': u.created_at.isoformat()
        } for u in users]
    })

@api_bp.route('/admin/top-categories', methods=['GET'])
@login_required
def get_top_categories():
    """[Admin] Top 5 danh mục chi tiêu nhiều nhất (toàn hệ thống)
    ---
    tags:
      - Admin
    responses:
      200:
        description: Top 5 danh mục có tổng chi tiêu cao nhất
      403:
        description: Không có quyền
    """
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get top 5 categories by expense amount
    from sqlalchemy import func
    top_cats = db.session.query(
        Category.name,
        func.sum(Transaction.amount).label('total')
    ).join(
        Transaction, Transaction.category_id == Category.id
    ).filter(
        Transaction.type == 'expense'
    ).group_by(
        Category.name
    ).order_by(
        func.sum(Transaction.amount).desc()
    ).limit(5).all()
    
    return jsonify({
        'categories': [{
            'category': cat_name,
            'amount': float(total)
        } for cat_name, total in top_cats]
    })