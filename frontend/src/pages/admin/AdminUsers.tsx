// Admin Users Page - Copy từ templates/admin/users.html
import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { API_BASE_URL } from '../../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  created_at?: string;
  last_login?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual admin API endpoint
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setCurrentUserId(data.current_user_id);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const adminCount = users.filter(u => u.is_admin).length;
  const userCount = users.filter(u => !u.is_admin).length;

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
            <i className="fas fa-users me-2"></i>
            Quản lý Người dùng
          </h2>
          <p className="text-muted">Danh sách và quản lý tất cả người dùng trong hệ thống</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Danh sách Người dùng
              </h5>
              <span className="badge bg-primary">{users.length} người dùng</span>
            </div>
            <div className="card-body">
              {users.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Tên đăng nhập</th>
                        <th>Email</th>
                        <th>Họ tên</th>
                        <th>Quyền</th>
                        <th>Ngày tạo</th>
                        <th>Đăng nhập cuối</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>
                            <strong>{user.username}</strong>
                            {user.id === currentUserId && (
                              <span className="badge bg-info ms-1">Bạn</span>
                            )}
                          </td>
                          <td>{user.email}</td>
                          <td>{user.full_name || '-'}</td>
                          <td>
                            {user.is_admin ? (
                              <span className="badge bg-danger">
                                <i className="fas fa-crown me-1"></i>Admin
                              </span>
                            ) : (
                              <span className="badge bg-secondary">
                                <i className="fas fa-user me-1"></i>User
                              </span>
                            )}
                          </td>
                          <td>
                            <small className="text-muted">
                              {formatDate(user.created_at)}
                            </small>
                          </td>
                          <td>
                            <small className="text-muted">
                              {user.last_login ? formatDate(user.last_login) : 'Chưa đăng nhập'}
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-users fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">Không có người dùng nào</h5>
                  <p className="text-muted">Chưa có người dùng nào trong hệ thống.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Statistics */}
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="fas fa-chart-pie me-2"></i>
                Thống kê Người dùng
              </h6>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-6">
                  <div className="border-end">
                    <h4 className="text-danger mb-1">{adminCount}</h4>
                    <small className="text-muted">Admin</small>
                  </div>
                </div>
                <div className="col-6">
                  <h4 className="text-secondary mb-1">{userCount}</h4>
                  <small className="text-muted">User thường</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Hướng dẫn
              </h6>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0">
                <li className="mb-2">
                  <i className="fas fa-user-plus text-success me-2"></i>
                  <small>Nhấn nút xanh để cấp quyền Admin</small>
                </li>
                <li className="mb-2">
                  <i className="fas fa-user-minus text-warning me-2"></i>
                  <small>Nhấn nút vàng để gỡ quyền Admin</small>
                </li>
                <li>
                  <i className="fas fa-shield-alt text-info me-2"></i>
                  <small>Không thể thay đổi quyền của chính mình</small>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
