// Add Transaction Page - With OCR Support
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionsAPI } from '../services/api';

interface Category {
  id: number;
  name: string;
  type: string;
}

interface FormData {
  type: string;
  amount: string;
  category_id: string;
  date: string;
  description: string;
}

interface ExtractedData {
  amount?: number;
  date?: string;
  description?: string;
  merchant?: string;
  category_suggestion?: string;
  confidence?: number;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export default function AddTransaction() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<FormData>({
    type: '',
    amount: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [loading, setLoading] = useState(false);
  
  // OCR states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [showOcrResults, setShowOcrResults] = useState(false);
  const [receiptImageFilename, setReceiptImageFilename] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await transactionsAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    setFormData(prev => ({ ...prev, type, category_id: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await transactionsAPI.create({
        type: formData.type,
        amount: parseFloat(formData.amount),
        category_id: parseInt(formData.category_id),
        date: formData.date,
        description: formData.description,
        receipt_image: receiptImageFilename
      });

      navigate('/transactions');
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      alert('Có lỗi xảy ra khi thêm giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const setAmount = (amount: number) => {
    setFormData(prev => ({ ...prev, amount: amount.toString() }));
  };

  // OCR Functions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      alert('File quá lớn! Vui lòng chọn file nhỏ hơn 20MB.');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setExtractedData(null);
    setShowOcrResults(false);
    setReceiptImageFilename(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const extractReceiptInfo = async () => {
    if (!selectedFile) {
      alert('Vui lòng chọn ảnh hóa đơn trước!');
      return;
    }

    setOcrLoading(true);
    setShowOcrResults(false);

    try {
      const formData = new FormData();
      formData.append('receipt_image', selectedFile);

      const response = await transactionsAPI.extractReceipt(formData);

      // Ảnh đã được server lưu lại (không xoá) ngay khi upload, nên luôn ghi nhận
      // tên file để đính kèm vào giao dịch, kể cả khi AI trích xuất dữ liệu thất bại.
      if (response.data.receipt_image) {
        setReceiptImageFilename(response.data.receipt_image);
      }

      if (response.data.success) {
        setExtractedData(response.data.data);
        setShowOcrResults(true);
        alert('Trích xuất thông tin thành công!');
      } else {
        alert('Lỗi: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error extracting receipt:', error);
      alert('Có lỗi xảy ra khi xử lý ảnh. Vui lòng thử lại.');
    } finally {
      setOcrLoading(false);
    }
  };

  const applyExtractedInfo = () => {
    if (!extractedData) return;

    const updates: Partial<FormData> = {};

    // Set transaction type to expense by default FIRST
    const currentType = formData.type || 'expense';
    if (!formData.type) {
      updates.type = currentType;
    }

    // Set amount
    if (extractedData.amount && extractedData.amount > 0) {
      updates.amount = extractedData.amount.toString();
    }

    // Set date
    if (extractedData.date) {
      updates.date = extractedData.date;
    }

    // Set description
    if (extractedData.description) {
      let newDesc = extractedData.description;
      if (extractedData.merchant) {
        newDesc += ` - ${extractedData.merchant}`;
      }
      
      if (formData.description && formData.description.trim() !== '') {
        newDesc = formData.description + '\n' + newDesc;
      }
      
      updates.description = newDesc;
    }

    // Try to match category (use currentType instead of formData.type)
    if (extractedData.category_suggestion) {
      const matchedCategory = categories.find(cat => 
        cat.type === currentType && 
        cat.name.toLowerCase().includes(extractedData.category_suggestion!.toLowerCase())
      );
      
      console.log('Category suggestion:', extractedData.category_suggestion);
      console.log('Current type:', currentType);
      console.log('Matched category:', matchedCategory);
      
      if (matchedCategory) {
        updates.category_id = matchedCategory.id.toString();
      }
    }

    setFormData(prev => ({ ...prev, ...updates }));
    setShowOcrResults(false);
    alert('Đã áp dụng thông tin từ ảnh!');
  };

  const hideOcrResults = () => {
    setShowOcrResults(false);
  };

  const filteredCategories = formData.type
    ? categories.filter(cat => cat.type === formData.type)
    : categories;

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div className="card">
          <div className="card-header">
            <h4 className="mb-0">
              <i className="fas fa-plus me-2"></i>
              Thêm giao dịch mới
            </h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} id="transactionForm">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="type" className="form-label">Loại giao dịch *</label>
                  <select
                    className="form-select"
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleTypeChange}
                    required
                  >
                    <option value="">Chọn loại giao dịch</option>
                    <option value="income">Thu nhập</option>
                    <option value="expense">Chi tiêu</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label htmlFor="amount" className="form-label">Số tiền *</label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0"
                      required
                      min="0"
                      step="1000"
                    />
                    <span className="input-group-text">₫</span>
                  </div>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="category_id" className="form-label">Danh mục *</label>
                  <select
                    className="form-select"
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Chọn danh mục</option>
                    {filteredCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label htmlFor="date" className="form-label">Ngày giao dịch *</label>
                  <input
                    type="date"
                    className="form-control"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="description" className="form-label">Mô tả</label>
                <textarea
                  className="form-control"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Mô tả chi tiết về giao dịch này (tùy chọn)"
                ></textarea>
              </div>

              {/* Receipt Upload with OCR */}
              <div className="mb-3">
                <label htmlFor="receipt" className="form-label">Hóa đơn/Ảnh chứng từ</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="form-control"
                  id="receipt"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div className="form-text">Chọn ảnh hóa đơn hoặc chứng từ (tùy chọn)</div>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-3">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="img-thumbnail" 
                      style={{ maxWidth: '300px' }}
                    />
                    <div className="mt-2">
                      <button 
                        type="button" 
                        className="btn btn-sm btn-success me-2"
                        onClick={extractReceiptInfo}
                        disabled={ocrLoading}
                      >
                        <i className="fas fa-magic me-1"></i> 
                        Tự động nhập từ ảnh
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-danger"
                        onClick={removeImage}
                      >
                        <i className="fas fa-times"></i> Xóa ảnh
                      </button>
                    </div>
                  </div>
                )}

                {/* OCR Progress */}
                {ocrLoading && (
                  <div className="mt-3">
                    <div className="d-flex align-items-center">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span>Đang phân tích ảnh hóa đơn...</span>
                    </div>
                  </div>
                )}

                {/* OCR Results */}
                {showOcrResults && extractedData && (
                  <div className="mt-3">
                    <div className="alert alert-info">
                      <h6>
                        <i className="fas fa-robot me-2"></i>
                        Thông tin được trích xuất từ ảnh:
                      </h6>
                      <div className="row g-2">
                        {extractedData.amount && extractedData.amount > 0 && (
                          <div className="col-md-6">
                            <strong>Số tiền:</strong> {new Intl.NumberFormat('vi-VN').format(extractedData.amount)} ₫
                          </div>
                        )}
                        {extractedData.date && (
                          <div className="col-md-6">
                            <strong>Ngày:</strong> {extractedData.date}
                          </div>
                        )}
                        {extractedData.description && (
                          <div className="col-12">
                            <strong>Mô tả:</strong> {extractedData.description}
                          </div>
                        )}
                        {extractedData.merchant && (
                          <div className="col-12">
                            <strong>Cửa hàng:</strong> {extractedData.merchant}
                          </div>
                        )}
                        {extractedData.category_suggestion && (
                          <div className="col-12">
                            <strong>Danh mục gợi ý:</strong>{' '}
                            <span className="badge bg-info">{extractedData.category_suggestion}</span>
                          </div>
                        )}
                        {extractedData.confidence && (
                          <div className="col-12">
                            <strong>Độ tin cậy:</strong>{' '}
                            <span className={`badge ${
                              extractedData.confidence >= 0.8 ? 'bg-success' : 
                              extractedData.confidence >= 0.6 ? 'bg-warning' : 
                              'bg-danger'
                            }`}>
                              {Math.round(extractedData.confidence * 100)}%
                            </span>
                          </div>
                        )}
                        {extractedData.items && extractedData.items.length > 0 && (
                          <div className="col-12">
                            <strong>Sản phẩm:</strong>
                            <ul className="mt-1 mb-0">
                              {extractedData.items.map((item, idx) => (
                                <li key={idx}>
                                  {item.name} - {item.quantity} x {new Intl.NumberFormat('vi-VN').format(item.price)} ₫
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <button 
                          type="button" 
                          className="btn btn-sm btn-primary me-2"
                          onClick={applyExtractedInfo}
                        >
                          <i className="fas fa-check me-1"></i> Áp dụng thông tin
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-outline-secondary"
                          onClick={hideOcrResults}
                        >
                          <i className="fas fa-times me-1"></i> Đóng
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="row">
                <div className="col-md-6">
                  <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Lưu giao dịch
                      </>
                    )}
                  </button>
                </div>
                <div className="col-md-6">
                  <button
                    type="button"
                    onClick={() => navigate('/transactions')}
                    className="btn btn-outline-secondary w-100"
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Quay lại
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="card mt-4">
          <div className="card-header">
            <h6 className="mb-0">
              <i className="fas fa-bolt me-2"></i>
              Số tiền thường dùng
            </h6>
          </div>
          <div className="card-body">
            <div className="row g-2">
              <div className="col-3">
                <button
                  type="button"
                  className="btn btn-outline-primary w-100"
                  onClick={() => setAmount(50000)}
                >
                  50K
                </button>
              </div>
              <div className="col-3">
                <button
                  type="button"
                  className="btn btn-outline-primary w-100"
                  onClick={() => setAmount(100000)}
                >
                  100K
                </button>
              </div>
              <div className="col-3">
                <button
                  type="button"
                  className="btn btn-outline-primary w-100"
                  onClick={() => setAmount(200000)}
                >
                  200K
                </button>
              </div>
              <div className="col-3">
                <button
                  type="button"
                  className="btn btn-outline-primary w-100"
                  onClick={() => setAmount(500000)}
                >
                  500K
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TODO: Recent Similar Transactions will be added later */}
      </div>
    </div>
  );
}
