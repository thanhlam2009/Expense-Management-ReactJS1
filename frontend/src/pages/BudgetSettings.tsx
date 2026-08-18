// Budget Settings Page - Copy từ templates/budget/settings.html
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { budgetAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

interface BudgetInfo {
  budget_limit: number;
  current_spending: number;
  spending_percentage: number;
  remaining_budget: number;
  alert_level: string;
  alert_color: string;
}

export default function BudgetSettings() {
  const navigate = useNavigate();
  const [budgetLimit, setBudgetLimit] = useState('');
  const [budgetInfo, setBudgetInfo] = useState<BudgetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadBudgetInfo();
  }, []);

  const loadBudgetInfo = async () => {
    try {
      setLoading(true);
      const { data } = await budgetAPI.getCurrent();
      setBudgetInfo(data);
      if (data.budget_limit) {
        setBudgetLimit(data.budget_limit.toString());
      }
    } catch (error) {
      console.error('Error loading budget info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedLimit = parseFloat(budgetLimit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      alert('Vui lòng nhập số tiền giới hạn hợp lệ, lớn hơn 0');
      return;
    }

    setSubmitting(true);

    try {
      await budgetAPI.set(parsedLimit);
      await loadBudgetInfo(); // Reload to show updated info
    } catch (error: any) {
      console.error('Error setting budget:', error);
      const message = error.response?.data?.message || 'Có lỗi xảy ra khi lưu giới hạn';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="fas fa-chart-line me-2"></i>
              Cài Đặt Giới Hạn Chi Tiêu
            </h2>
            <button onClick={() => navigate('/')} className="btn btn-outline-secondary">
              <i className="fas fa-arrow-left me-2"></i>
              Quay lại Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Form đặt giới hạn */}
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-wallet me-2"></i>
                Đặt Giới Hạn Tháng Này
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="budgetLimit" className="form-label">Giới hạn chi tiêu (VNĐ)</label>
                  <div className="input-group">
                    <span className="input-group-text">₫</span>
                    <input 
                      type="number" 
                      className="form-control" 
                      id="budgetLimit"
                      value={budgetLimit}
                      onChange={(e) => setBudgetLimit(e.target.value)}
                      placeholder="Nhập số tiền giới hạn" 
                      min="0" 
                      step="1000" 
                      required
                    />
                  </div>
                  <div className="form-text">Nhập số tiền tối đa bạn muốn chi tiêu trong tháng này</div>
                </div>
                
                <div className="d-grid">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Lưu Giới Hạn
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Thông tin hiện tại */}
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Thông Tin Hiện Tại
              </h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : budgetInfo && budgetInfo.budget_limit > 0 ? (
                <div className="mb-3">
                  <h6 className="text-center mb-3">
                    <i className="fas fa-calendar me-2"></i>
                    {getCurrentMonth()}
                  </h6>
                  
                  <div className="row text-center mb-3">
                    <div className="col-6">
                      <div className="border rounded p-2 bg-light">
                        <div className="text-muted small">Giới hạn</div>
                        <div className="fw-bold text-primary">{formatCurrency(budgetInfo.budget_limit)}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="border rounded p-2 bg-light">
                        <div className="text-muted small">Đã chi</div>
                        <div className="fw-bold text-danger">{formatCurrency(budgetInfo.current_spending)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="small">Tiến độ chi tiêu</span>
                      <span className="small fw-bold">{budgetInfo.spending_percentage}%</span>
                    </div>
                    <div className="progress" style={{ height: '12px' }}>
                      <div 
                        className={`progress-bar bg-${budgetInfo.alert_color}`}
                        style={{ width: `${Math.min(budgetInfo.spending_percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className={`alert alert-${budgetInfo.alert_color} mb-0`}>
                    <div className="d-flex align-items-center">
                      <i className={`fas fa-${budgetInfo.alert_color === 'warning' || budgetInfo.alert_color === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2`}></i>
                      <div>
                        <strong>{budgetInfo.alert_level}</strong><br />
                        <small>
                          {budgetInfo.remaining_budget >= 0 ? (
                            <>Còn lại: {formatCurrency(budgetInfo.remaining_budget)}</>
                          ) : (
                            <>Vượt quá: {formatCurrency(-budgetInfo.remaining_budget)}</>
                          )}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <i className="fas fa-wallet fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">Chưa Đặt Giới Hạn</h5>
                  <p className="text-muted">Vui lòng nhập giới hạn chi tiêu ở form bên trái để bắt đầu theo dõi.</p>
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Hệ thống sẽ cảnh báo khi chi tiêu đạt 80% giới hạn
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hướng dẫn */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="fas fa-lightbulb me-2"></i>
                Hướng Dẫn Sử Dụng
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>
                    <i className="fas fa-target text-primary me-2"></i>
                    Cách Hoạt Động
                  </h6>
                  <ul className="list-unstyled">
                    <li><i className="fas fa-check text-success me-2"></i>Đặt giới hạn chi tiêu cho tháng hiện tại</li>
                    <li><i className="fas fa-check text-success me-2"></i>Hệ thống sẽ theo dõi chi tiêu của bạn</li>
                    <li><i className="fas fa-check text-success me-2"></i>Cảnh báo khi đạt 80% giới hạn</li>
                    <li><i className="fas fa-check text-success me-2"></i>Hiển thị trạng thái trên Dashboard</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>
                    <i className="fas fa-palette text-warning me-2"></i>
                    Mức Độ Cảnh Báo
                  </h6>
                  <ul className="list-unstyled">
                    <li><span className="badge bg-success me-2">An toàn</span>&lt; 70% giới hạn</li>
                    <li><span className="badge bg-info me-2">Chú ý</span>70% - 80% giới hạn</li>
                    <li><span className="badge bg-warning me-2">Cảnh báo</span>80% - 95% giới hạn</li>
                    <li><span className="badge bg-danger me-2">Nguy hiểm</span>&gt; 95% giới hạn</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
