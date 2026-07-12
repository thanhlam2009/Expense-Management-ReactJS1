import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FormField, SelectField, TextAreaField } from '../../components/common';
import { validateField } from '../../utils/validation';
import { API_BASE_URL } from '../../services/api';

const AddCategory: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    const nameError = validateField(formData.name, { required: true, minLength: 2, maxLength: 100 });
    if (nameError) newErrors.name = nameError;

    const typeError = validateField(formData.type, { required: true });
    if (typeError) newErrors.type = typeError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/categories`, formData, { withCredentials: true });
      navigate('/admin/categories');
    } catch (error: any) {
      console.error('Error adding category:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi thêm danh mục');
    } finally {
      setLoading(false);
    }
  };

  const categoryExamples = {
    income: [
      'Lương',
      'Thưởng',
      'Đầu tư',
      'Kinh doanh',
      'Thu nhập khác'
    ],
    expense: [
      'Ăn uống',
      'Xăng xe',
      'Mua sắm',
      'Giải trí',
      'Y tế',
      'Học tập',
      'Hóa đơn',
      'Nhà cửa'
    ]
  };

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold text-dark">
                <i className="fas fa-plus me-2"></i>
                Thêm Danh mục Mới
              </h2>
              <p className="text-muted">Tạo danh mục mới cho thu nhập hoặc chi tiêu</p>
            </div>
            <button onClick={() => navigate('/admin/categories')} className="btn btn-secondary">
              <i className="fas fa-arrow-left me-2"></i>
              Quay lại
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-tag me-2"></i>
                Thông tin Danh mục
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <FormField
                      label="Tên danh mục"
                      name="name"
                      value={formData.name}
                      error={errors.name}
                      required
                      placeholder="Nhập tên danh mục"
                      icon="fas fa-tag"
                      helpText="Ví dụ: Lương, Ăn uống, Xăng xe..."
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <SelectField
                      label="Loại danh mục"
                      name="type"
                      value={formData.type}
                      options={[
                        { value: 'income', label: '📈 Thu nhập' },
                        { value: 'expense', label: '📉 Chi tiêu' }
                      ]}
                      error={errors.type}
                      required
                      icon="fas fa-exchange-alt"
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <TextAreaField
                  label="Mô tả (tùy chọn)"
                  name="description"
                  value={formData.description}
                  error={errors.description}
                  placeholder="Mô tả chi tiết về danh mục này..."
                  icon="fas fa-align-left"
                  helpText="Mô tả giúp phân biệt và sử dụng danh mục hiệu quả hơn"
                  rows={3}
                  maxLength={500}
                  onChange={handleChange}
                />

                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button
                    type="button"
                    className="btn btn-outline-secondary me-md-2"
                    onClick={() => navigate('/admin/categories')}
                    disabled={loading}
                  >
                    <i className="fas fa-times me-1"></i>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-1"></i>
                        Lưu danh mục
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Category Examples */}
      <div className="row mt-4">
        <div className="col-lg-8 mx-auto">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-lightbulb me-2"></i>
                Gợi ý Danh mục
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {/* Income Examples */}
                <div className="col-md-6 mb-3">
                  <h6 className="text-success">
                    <i className="fas fa-arrow-up me-2"></i>
                    Thu nhập
                  </h6>
                  <ul className="list-unstyled">
                    {categoryExamples.income.map((example, idx) => (
                      <li key={idx} className="mb-1">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Expense Examples */}
                <div className="col-md-6 mb-3">
                  <h6 className="text-danger">
                    <i className="fas fa-arrow-down me-2"></i>
                    Chi tiêu
                  </h6>
                  <ul className="list-unstyled">
                    {categoryExamples.expense.map((example, idx) => (
                      <li key={idx} className="mb-1">
                        <i className="fas fa-check-circle text-danger me-2"></i>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="alert alert-info mb-0">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Mẹo:</strong> Nên tạo danh mục cụ thể để dễ quản lý và phân tích chi tiêu sau này.
                Tránh tạo quá nhiều danh mục tương tự nhau.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics (Optional) */}
      <div className="row mt-4">
        <div className="col-lg-8 mx-auto">
          <div className="card border-primary">
            <div className="card-body">
              <h6 className="card-title text-primary">
                <i className="fas fa-chart-bar me-2"></i>
                Lưu ý khi tạo danh mục
              </h6>
              <ul className="mb-0">
                <li className="mb-2">
                  <strong>Tên rõ ràng:</strong> Đặt tên dễ hiểu và không trùng lặp
                </li>
                <li className="mb-2">
                  <strong>Phân loại đúng:</strong> Chọn đúng loại thu nhập hoặc chi tiêu
                </li>
                <li className="mb-2">
                  <strong>Mô tả chi tiết:</strong> Thêm mô tả giúp người dùng hiểu rõ mục đích sử dụng
                </li>
                <li>
                  <strong>Không thể xóa:</strong> Danh mục đã được sử dụng trong giao dịch sẽ không thể xóa
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCategory;
