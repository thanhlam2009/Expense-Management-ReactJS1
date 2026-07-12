// Edit Transaction Page - Copy từ templates/transactions/edit.html
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { transactionsAPI, API_BASE_URL } from '../services/api';

interface Category {
  id: number;
  name: string;
  type: string;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  category_id: number;
  date: string;
  description: string;
  receipt_image?: string;
}

export default function EditTransaction() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    type: '',
    amount: '',
    category_id: '',
    date: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionResponse, categoriesResponse] = await Promise.all([
        transactionsAPI.getById(parseInt(id!)),
        transactionsAPI.getCategories()
      ]);
      
      const transactionData = transactionResponse.data;
      const categoriesData = categoriesResponse.data;
      
      setTransaction(transactionData);
      setCategories(categoriesData);
      
      // Pre-populate form
      setFormData({
        type: transactionData.type,
        amount: transactionData.amount.toString(),
        category_id: transactionData.category_id.toString(),
        date: transactionData.date,
        description: transactionData.description || ''
      });
    } catch (error) {
      console.error('Error loading transaction:', error);
      alert('Không tìm thấy giao dịch');
      navigate('/transactions');
    } finally {
      setLoading(false);
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
    setSubmitting(true);

    try {
      await transactionsAPI.update(parseInt(id!), {
        type: formData.type,
        amount: parseFloat(formData.amount),
        category_id: parseInt(formData.category_id),
        date: formData.date,
        description: formData.description
      });

      navigate('/transactions');
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      alert('Có lỗi xảy ra khi cập nhật giao dịch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
      return;
    }

    try {
      await transactionsAPI.delete(parseInt(id!));
      navigate('/transactions');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Có lỗi xảy ra khi xóa giao dịch');
    }
  };

  const filteredCategories = formData.type
    ? categories.filter(cat => cat.type === formData.type)
    : categories;

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div className="card">
          <div className="card-header">
            <h4 className="mb-0">
              <i className="fas fa-edit me-2"></i>
              Chỉnh sửa giao dịch
            </h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
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
                  placeholder="Mô tả chi tiết về giao dịch này"
                ></textarea>
              </div>

              <div className="mb-3">
                <label className="form-label">Hóa đơn/Ảnh chứng từ</label>
                {transaction?.receipt_image && (
                  <div className="current-image mb-2">
                    <img
                      src={`${API_BASE_URL}/static/uploads/${transaction.receipt_image}`}
                      alt="Current receipt"
                      className="img-thumbnail"
                      style={{ maxWidth: '200px' }}
                    />
                    <p className="text-muted">Ảnh hiện tại</p>
                  </div>
                )}
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  disabled
                />
                <div className="form-text text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  Chức năng thay đổi ảnh sẽ được bổ sung sau
                </div>
              </div>

              <div className="row">
                <div className="col-md-4">
                  <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Đang cập nhật...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Cập nhật
                      </>
                    )}
                  </button>
                </div>
                <div className="col-md-4">
                  <button
                    type="button"
                    onClick={() => navigate('/transactions')}
                    className="btn btn-outline-secondary w-100"
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Quay lại
                  </button>
                </div>
                <div className="col-md-4">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="btn btn-outline-danger w-100"
                  >
                    <i className="fas fa-trash me-2"></i>
                    Xóa
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
