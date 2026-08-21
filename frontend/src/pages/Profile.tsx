// Profile Page - Copy từ templates/main/profile.html
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { statsAPI, transactionsAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

interface Stats {
  total_income: number;
  total_expense: number;
  balance: number;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      const [statsRes, transactionsData] = await Promise.all([
        statsAPI.overview(),
        transactionsAPI.getSimpleList()
      ]);
      
      setStats(statsRes.data);
      setTotalTransactions(transactionsData.data?.length || 0);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa có thông tin';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportUserData = () => {
    alert('Chức năng xuất dữ liệu đang được phát triển');
  };

  const changePassword = () => {
    const newPassword = prompt('Nhập mật khẩu mới (ít nhất 6 ký tự):');
    if (newPassword && newPassword.length >= 6) {
      alert('Chức năng đổi mật khẩu đang được phát triển');
    } else if (newPassword) {
      alert('Mật khẩu phải có ít nhất 6 ký tự!');
    }
  };

  const viewActivity = () => {
    alert('Chức năng xem lịch sử hoạt động đang được phát triển');
  };

  const deleteAccount = () => {
    if (window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác!')) {
      if (window.confirm('Bạn có thực sự chắc chắn? Tất cả dữ liệu của bạn sẽ bị mất vĩnh viễn!')) {
        alert('Chức năng xóa tài khoản đang được phát triển');
      }
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div className="card">
          <div className="card-header">
            <h4 className="mb-0">
              <i className="fas fa-user me-2"></i>
              Hồ sơ cá nhân
            </h4>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 text-center">
                <div className="mb-3">
                  <i className="fas fa-user-circle fa-5x text-primary"></i>
                </div>
                <h5>{user.full_name}</h5>
                <p className="text-muted">{user.email}</p>
                {user.is_admin ? (
                  <span className="badge bg-warning">Administrator</span>
                ) : (
                  <span className="badge bg-primary">User</span>
                )}
              </div>
              <div className="col-md-8">
                <h6 className="fw-bold mb-3">Thông tin tài khoản</h6>
                <table className="table table-borderless">
                  <tbody>
                    <tr>
                      <td><strong>Email:</strong></td>
                      <td>{user.email}</td>
                    </tr>
                    <tr>
                      <td><strong>Họ và tên:</strong></td>
                      <td>{user.full_name}</td>
                    </tr>
                    <tr>
                      <td><strong>Xác thực email:</strong></td>
                      <td>
                        {user.is_verified ? (
                          <span className="badge bg-success">Đã xác thực</span>
                        ) : (
                          <span className="badge bg-warning">Chưa xác thực</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Ngày tạo tài khoản:</strong></td>
                      <td>{formatDate(user.created_at)}</td>
                    </tr>
                    <tr>
                      <td><strong>Lần đăng nhập cuối:</strong></td>
                      <td>{formatDate(user.last_login)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Account Statistics */}
        <div className="card mt-4">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="fas fa-chart-line me-2"></i>
              Thống kê tài khoản
            </h5>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center py-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="row text-center">
                <div className="col-md-3">
                  <div className="border-end">
                    <h4 className="text-primary">{totalTransactions}</h4>
                    <small className="text-muted">Tổng giao dịch</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="border-end">
                    <h4 className="text-success">{stats ? formatCurrency(stats.total_income) : '...'}</h4>
                    <small className="text-muted">Tổng thu nhập</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="border-end">
                    <h4 className="text-danger">{stats ? formatCurrency(stats.total_expense) : '...'}</h4>
                    <small className="text-muted">Tổng chi tiêu</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <h4 className="text-info">{stats ? formatCurrency(stats.balance) : '...'}</h4>
                  <small className="text-muted">Số dư</small>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Settings */}
        <div className="card mt-4">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="fas fa-cog me-2"></i>
              Cài đặt nhanh
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <button type="button" className="btn btn-outline-primary w-100" onClick={exportUserData}>
                  <i className="fas fa-download me-2"></i>
                  Xuất dữ liệu cá nhân
                </button>
              </div>
              <div className="col-md-6 mb-3">
                <button type="button" className="btn btn-outline-warning w-100" onClick={changePassword}>
                  <i className="fas fa-key me-2"></i>
                  Đổi mật khẩu
                </button>
              </div>
              <div className="col-md-6 mb-3">
                <button type="button" className="btn btn-outline-info w-100" onClick={viewActivity}>
                  <i className="fas fa-history me-2"></i>
                  Lịch sử hoạt động
                </button>
              </div>
              <div className="col-md-6 mb-3">
                <button type="button" className="btn btn-outline-danger w-100" onClick={deleteAccount}>
                  <i className="fas fa-user-times me-2"></i>
                  Xóa tài khoản
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-4">
          <button onClick={() => navigate('/')} className="btn btn-primary">
            <i className="fas fa-arrow-left me-2"></i>
            Quay lại Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
