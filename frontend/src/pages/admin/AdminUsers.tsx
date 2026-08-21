// Admin Users Page - Copy từ templates/admin/users.html
import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  is_admin: boolean;
  is_verified: boolean;
  is_active: boolean;
  created_at?: string;
  last_login?: string;
}

interface CreateForm {
  fullName: string;
  email: string;
  password: string;
  isAdmin: boolean;
}

interface EditForm {
  fullName: string;
  email: string;
  password: string;
}

const EMPTY_CREATE_FORM: CreateForm = { fullName: '', email: '', password: '', isAdmin: false };
const EMPTY_EDIT_FORM: EditForm = { fullName: '', email: '', password: '' };

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [search, setSearch] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE_FORM);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT_FORM);
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers();
      setUsers(response.data.users || []);
      setCurrentUserId(response.data.current_user_id);
    } catch (err) {
      console.error('Error loading users:', err);
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

  const activeUsers = users.filter(u => u.is_active);
  const deletedUsers = users.filter(u => !u.is_active);
  const adminCount = activeUsers.filter(u => u.is_admin).length;
  const userCount = activeUsers.filter(u => !u.is_admin).length;

  const visibleUsers = (activeTab === 'active' ? activeUsers : deletedUsers).filter(u => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return u.full_name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
  });

  const flash = (msg: string) => {
    setMessage(msg);
    setError('');
  };
  const flashError = (msg: string) => {
    setError(msg);
    setMessage('');
  };

  const handleToggleAdmin = async (user: User) => {
    setBusyUserId(user.id);
    try {
      const res = await adminAPI.toggleAdmin(user.id);
      flash(res.data.message);
      await loadUsers();
    } catch (err: any) {
      flashError(err.response?.data?.error || 'Không thể cập nhật quyền.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Xóa tài khoản "${user.full_name}"? Tài khoản sẽ không đăng nhập được nữa, nhưng dữ liệu vẫn được giữ lại và có thể khôi phục sau.`)) {
      return;
    }
    setBusyUserId(user.id);
    try {
      const res = await adminAPI.deleteUser(user.id);
      flash(res.data.message);
      await loadUsers();
    } catch (err: any) {
      flashError(err.response?.data?.error || 'Không thể xóa tài khoản.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRestore = async (user: User) => {
    setBusyUserId(user.id);
    try {
      const res = await adminAPI.restoreUser(user.id);
      flash(res.data.message);
      await loadUsers();
    } catch (err: any) {
      flashError(err.response?.data?.error || 'Không thể khôi phục tài khoản.');
    } finally {
      setBusyUserId(null);
    }
  };

  const openCreateModal = () => {
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateError('');
    setShowCreateModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const res = await adminAPI.createUser({
        full_name: createForm.fullName,
        email: createForm.email,
        password: createForm.password,
        is_admin: createForm.isAdmin
      });
      setShowCreateModal(false);
      flash(res.data.message);
      await loadUsers();
    } catch (err: any) {
      setCreateError(err.response?.data?.error || 'Không thể tạo tài khoản.');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({ fullName: user.full_name, email: user.email, password: '' });
    setEditError('');
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError('');
    setSaving(true);
    try {
      const res = await adminAPI.updateUser(editingUser.id, {
        full_name: editForm.fullName,
        email: editForm.email,
        ...(editForm.password ? { password: editForm.password } : {})
      });
      setEditingUser(null);
      flash(res.data.message);
      await loadUsers();
    } catch (err: any) {
      setEditError(err.response?.data?.error || 'Không thể cập nhật tài khoản.');
    } finally {
      setSaving(false);
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
            <i className="fas fa-users me-2"></i>
            Quản lý Người dùng
          </h2>
          <p className="text-muted">Danh sách và quản lý tất cả người dùng trong hệ thống</p>
        </div>
      </div>

      {message && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Users Table */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Danh sách Người dùng
              </h5>
              <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
                <i className="fas fa-user-plus me-1"></i>
                Thêm người dùng
              </button>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <ul className="nav nav-tabs card-header-tabs" style={{ border: 'none' }}>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${activeTab === 'active' ? 'active' : ''}`}
                      onClick={() => setActiveTab('active')}
                    >
                      Đang hoạt động
                      <span className="badge bg-primary ms-2">{activeUsers.length}</span>
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${activeTab === 'deleted' ? 'active' : ''}`}
                      onClick={() => setActiveTab('deleted')}
                    >
                      Đã xóa
                      <span className="badge bg-secondary ms-2">{deletedUsers.length}</span>
                    </button>
                  </li>
                </ul>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  style={{ maxWidth: 260 }}
                  placeholder="Tìm theo họ tên hoặc email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {visibleUsers.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Họ tên</th>
                        <th>Quyền</th>
                        <th>Xác thực</th>
                        <th>Ngày tạo</th>
                        <th>Đăng nhập cuối</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleUsers.map(user => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.email}</td>
                          <td>
                            <strong>{user.full_name || '-'}</strong>
                            {user.id === currentUserId && (
                              <span className="badge bg-info ms-1">Bạn</span>
                            )}
                          </td>
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
                            {user.is_verified ? (
                              <span className="badge bg-success">Đã xác thực</span>
                            ) : (
                              <span className="badge bg-warning">Chưa xác thực</span>
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
                          <td>
                            <div className="d-flex gap-1">
                              {activeTab === 'active' ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    title="Sửa thông tin"
                                    onClick={() => openEditModal(user)}
                                    disabled={busyUserId === user.id}
                                  >
                                    <i className="fas fa-pen"></i>
                                  </button>
                                  {user.id !== currentUserId && (
                                    <>
                                      <button
                                        type="button"
                                        className={`btn btn-sm ${user.is_admin ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                        title={user.is_admin ? 'Gỡ quyền Admin' : 'Cấp quyền Admin'}
                                        onClick={() => handleToggleAdmin(user)}
                                        disabled={busyUserId === user.id}
                                      >
                                        <i className={`fas ${user.is_admin ? 'fa-user-minus' : 'fa-user-shield'}`}></i>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        title="Xóa tài khoản"
                                        onClick={() => handleDelete(user)}
                                        disabled={busyUserId === user.id}
                                      >
                                        <i className="fas fa-trash"></i>
                                      </button>
                                    </>
                                  )}
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-outline-success btn-sm"
                                  onClick={() => handleRestore(user)}
                                  disabled={busyUserId === user.id}
                                >
                                  <i className="fas fa-trash-restore me-1"></i>
                                  Khôi phục
                                </button>
                              )}
                            </div>
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
                  <p className="text-muted">
                    {activeTab === 'active' ? 'Chưa có người dùng nào trong hệ thống.' : 'Chưa có tài khoản nào bị xóa.'}
                  </p>
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
                  <i className="fas fa-user-shield text-success me-2"></i>
                  <small>Nhấn nút xanh để cấp quyền Admin, nút vàng để gỡ quyền</small>
                </li>
                <li className="mb-2">
                  <i className="fas fa-trash text-danger me-2"></i>
                  <small>Xóa tài khoản chỉ ẩn khỏi danh sách hoạt động, dữ liệu vẫn được giữ và khôi phục được</small>
                </li>
                <li>
                  <i className="fas fa-shield-alt text-info me-2"></i>
                  <small>Không thể tự xóa hoặc thay đổi quyền của chính mình</small>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleCreate}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-user-plus me-2"></i>
                    Thêm người dùng
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                </div>
                <div className="modal-body">
                  {createError && (
                    <div className="alert alert-danger py-2">{createError}</div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Họ và tên</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createForm.fullName}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={createForm.email}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mật khẩu</label>
                    <input
                      type="password"
                      className="form-control"
                      value={createForm.password}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                      minLength={6}
                      required
                    />
                    <div className="form-text">Ít nhất 6 ký tự</div>
                  </div>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="createIsAdmin"
                      checked={createForm.isAdmin}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, isAdmin: e.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="createIsAdmin">Cấp quyền Admin</label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleEdit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-pen me-2"></i>
                    Sửa người dùng
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setEditingUser(null)}></button>
                </div>
                <div className="modal-body">
                  {editError && (
                    <div className="alert alert-danger py-2">{editError}</div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Họ và tên</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Đặt lại mật khẩu</label>
                    <input
                      type="password"
                      className="form-control"
                      value={editForm.password}
                      onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                      minLength={6}
                      placeholder="Để trống nếu không đổi mật khẩu"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
