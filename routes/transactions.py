from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from services.ocr_service import get_ocr_service

transactions_bp = Blueprint('transactions', __name__)

def allowed_file(filename):
    """Kiểm tra file extension có được phép không"""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'bmp', 'webp'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@transactions_bp.route('/extract-receipt', methods=['POST'])
@login_required
def extract_receipt_info():
    """Trích xuất thông tin hóa đơn bằng AI (OCR)
    Upload ảnh hóa đơn, hệ thống gửi tới Gemini/OpenAI để trích xuất số tiền, ngày, mô tả,
    cửa hàng và gợi ý danh mục.
    ---
    tags:
      - Receipt OCR
    consumes:
      - multipart/form-data
    parameters:
      - name: receipt_image
        in: formData
        type: file
        required: true
        description: "Ảnh hóa đơn (png/jpg/jpeg/gif/pdf/bmp/webp)"
    responses:
      200:
        description: "Kết quả trích xuất: {success, data: {amount, date, description, merchant, items, category_suggestion, confidence}}"
      400:
        description: Không có file, hoặc định dạng file không được hỗ trợ
    """
    try:
        # Debug log
        print("Files in request:", request.files)
        print("Form data:", request.form)
        
        # Kiểm tra có file được upload không
        if 'receipt_image' not in request.files:
            return jsonify({
                'success': False,
                'message': 'Không có file được chọn'
            }), 400
        
        file = request.files['receipt_image']
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'Không có file được chọn'
            }), 400
        
        # Kiểm tra định dạng file
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'message': 'Định dạng file không được hỗ trợ'
            }), 400
        
        # Lưu file tạm thời
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"
        
        upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        os.makedirs(os.path.dirname(upload_path), exist_ok=True)
        file.save(upload_path)
        
        # Khởi tạo OCR service và trích xuất thông tin
        ocr_service = get_ocr_service()
        result = ocr_service.extract_receipt_info(upload_path)
        
        # Xóa file tạm sau khi xử lý
        try:
            os.remove(upload_path)
        except:
            pass
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Lỗi khi xử lý ảnh: {str(e)}'
        }), 500
