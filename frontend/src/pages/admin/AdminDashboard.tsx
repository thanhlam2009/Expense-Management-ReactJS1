// Admin Dashboard - Copy từ templates/admin/dashboard.html
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import MonthlyAnalysis from '../../components/Dashboard/MonthlyAnalysis';
import AdvancedAnalysis from '../../components/AdvancedAnalysis';
import { API_BASE_URL } from '../../services/api';

interface AdminStats {
  total_users: number;
  total_transactions: number;
  total_income: number;
  total_expense: number;
  recent_users: Array<{
    id: number;
    full_name: string;
    email: string;
    username: string;
    is_admin: boolean;
    created_at: string;
  }>;
  top_categories: Array<[string, number]>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual admin API endpoint
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const exportData = () => {
    if (window.confirm('Bạn có chắc chắn muốn xuất toàn bộ dữ liệu hệ thống?')) {
      alert('Chức năng xuất dữ liệu đang được phát triển');
    }
  };

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
    <>
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="fw-bold text-dark">
            <i className="fas fa-cogs me-2"></i>
            Admin Dashboard
          </h2>
          <p className="text-muted">Tổng quan hệ thống và quản lý người dùng</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card stats-card">
            <div className="card-body text-center">
              <div className="icon text-primary">
                <i className="fas fa-users"></i>
              </div>
              <div className="amount text-primary">
                {stats?.total_users || 0}
              </div>
              <div className="label">Tổng người dùng</div>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card stats-card">
            <div className="card-body text-center">
              <div className="icon text-info">
                <i className="fas fa-exchange-alt"></i>
              </div>
              <div className="amount text-info">
                {stats?.total_transactions || 0}
              </div>
              <div className="label">Tổng giao dịch</div>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card stats-card">
            <div className="card-body text-center">
              <div className="icon text-success">
                <i className="fas fa-arrow-up"></i>
              </div>
              <div className="amount text-success">
                {stats ? formatCurrency(stats.total_income) : '0 ₫'}
              </div>
              <div className="label">Tổng thu nhập</div>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card stats-card">
            <div className="card-body text-center">
              <div className="icon text-danger">
                <i className="fas fa-arrow-down"></i>
              </div>
              <div className="amount text-danger">
                {stats ? formatCurrency(stats.total_expense) : '0 ₫'}
              </div>
              <div className="label">Tổng chi tiêu</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Recent Users */}
        <div className="col-lg-6 mb-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-user-plus me-2"></i>
                Người dùng mới nhất
              </h5>
              <button onClick={() => navigate('/admin/users')} className="btn btn-sm btn-outline-primary">
                Xem tất cả
              </button>
            </div>
            <div className="card-body">
              {stats?.recent_users && stats.recent_users.length > 0 ? (
                stats.recent_users.map(user => (
                  <div key={user.id} className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 className="mb-1">{user.full_name}</h6>
                      <small className="text-muted">
                        {user.email}
                        {user.is_admin && (
                          <span className="badge bg-warning ms-1">Admin</span>
                        )}
                      </small>
                    </div>
                    <div className="text-end">
                      <small className="text-muted">{formatDate(user.created_at)}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted text-center">Chưa có người dùng nào</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Top Categories */}
        <div className="col-lg-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-chart-pie me-2"></i>
                Danh mục chi tiêu hàng đầu
              </h5>
            </div>
            <div className="card-body">
              {stats?.top_categories && stats.top_categories.length > 0 ? (
                stats.top_categories.map(([category, amount], index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-3">
                    <div style={{ flex: 1 }}>
                      <h6 className="mb-1">{category}</h6>
                      <div className="progress" style={{ height: '6px' }}>
                        <div 
                          className="progress-bar bg-primary" 
                          role="progressbar" 
                          style={{ width: `${stats.top_categories[0] ? (amount / stats.top_categories[0][1] * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-end ms-3">
                      <span className="fw-bold text-danger">{formatCurrency(amount)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted text-center">Chưa có dữ liệu chi tiêu</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Analysis */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-chart-line me-2"></i>
                Phân tích thu chi trung bình
              </h5>
            </div>
            <div className="card-body">
              <MonthlyAnalysis />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Analysis */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-brain me-2"></i>
                Phân tích nâng cao
              </h5>
            </div>
            <div className="card-body">
              <AdvancedAnalysis />
            </div>
          </div>
        </div>
      </div>

      {/* System Actions */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-tools me-2"></i>
                Công cụ quản trị
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <button 
                    onClick={() => navigate('/admin/users')} 
                    className="btn btn-outline-primary w-100 h-100 d-flex flex-column justify-content-center"
                    style={{ minHeight: '120px' }}
                  >
                    <i className="fas fa-users fa-2x mb-2"></i>
                    <span>Quản lý người dùng</span>
                  </button>
                </div>
                <div className="col-md-3 mb-3">
                  <button 
                    onClick={() => navigate('/admin/categories')} 
                    className="btn btn-outline-success w-100 h-100 d-flex flex-column justify-content-center"
                    style={{ minHeight: '120px' }}
                  >
                    <i className="fas fa-tags fa-2x mb-2"></i>
                    <span>Quản lý danh mục</span>
                  </button>
                </div>
                <div className="col-md-3 mb-3">
                  <button 
                    onClick={() => navigate('/admin/transactions')} 
                    className="btn btn-outline-info w-100 h-100 d-flex flex-column justify-content-center"
                    style={{ minHeight: '120px' }}
                  >
                    <i className="fas fa-exchange-alt fa-2x mb-2"></i>
                    <span>Quản lý giao dịch</span>
                  </button>
                </div>
                <div className="col-md-3 mb-3">
                  <button 
                    type="button" 
                    onClick={exportData}
                    className="btn btn-outline-warning w-100 h-100 d-flex flex-column justify-content-center"
                    style={{ minHeight: '120px' }}
                  >
                    <i className="fas fa-download fa-2x mb-2"></i>
                    <span>Xuất dữ liệu</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
