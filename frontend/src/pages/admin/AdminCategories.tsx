// Admin Categories Page - Copy từ templates/admin/categories.html
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { API_BASE_URL, categoriesAPI } from '../../services/api';

interface Category {
  id: number;
  name: string;
  description?: string;
  type: string;
  created_at?: string;
  transaction_count: number;
}

export default function AdminCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [listError, setListError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual admin API endpoint
      const response = await fetch(`${API_BASE_URL}/api/admin/categories`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditDescription(category.description || '');
    setEditError('');
  };

  const closeEdit = () => {
    setEditingCategory(null);
    setEditError('');
  };

  const saveEdit = async () => {
    if (!editingCategory) return;
    try {
      setSaving(true);
      setEditError('');
      await categoriesAPI.update(editingCategory.id, {
        name: editName,
        type: editingCategory.type,
        description: editDescription,
      });
      closeEdit();
      loadCategories();
    } catch (err: any) {
      setEditError(err?.response?.data?.error || 'Có lỗi xảy ra khi cập nhật danh mục');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Xóa danh mục "${category.name}"?`)) return;
    try {
      setDeletingId(category.id);
      setListError('');
      await categoriesAPI.delete(category.id);
      loadCategories();
    } catch (err: any) {
      setListError(err?.response?.data?.error || 'Có lỗi xảy ra khi xóa danh mục');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

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
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold text-dark">
                <i className="fas fa-tags me-2"></i>
                Quản lý Danh mục
              </h2>
              <p className="text-muted">Quản lý danh mục thu nhập và chi tiêu</p>
            </div>
            <button
              onClick={() => navigate('/admin/categories/add')}
              className="btn btn-primary"
            >
              <i className="fas fa-plus me-2"></i>
              Thêm danh mục
            </button>
          </div>
          {listError && (
            <Alert variant="danger" className="mt-3" onClose={() => setListError('')} dismissible>
              {listError}
            </Alert>
          )}
        </div>
      </div>

      {/* Categories Overview */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body text-center">
              <div className="icon text-success mb-2">
                <i className="fas fa-arrow-up fa-2x"></i>
              </div>
              <h4 className="text-success">{incomeCategories.length}</h4>
              <p className="text-muted mb-0">Danh mục Thu nhập</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-body text-center">
              <div className="icon text-danger mb-2">
                <i className="fas fa-arrow-down fa-2x"></i>
              </div>
              <h4 className="text-danger">{expenseCategories.length}</h4>
              <p className="text-muted mb-0">Danh mục Chi tiêu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Income Categories */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <i className="fas fa-arrow-up me-2"></i>
                Danh mục Thu nhập ({incomeCategories.length})
              </h5>
            </div>
            <div className="card-body">
              {incomeCategories.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Tên danh mục</th>
                        <th>Mô tả</th>
                        <th>Số giao dịch</th>
                        <th>Ngày tạo</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeCategories.map(category => (
                        <tr key={category.id}>
                          <td>{category.id}</td>
                          <td>
                            <strong className="text-success">{category.name}</strong>
                          </td>
                          <td>
                            <small className="text-muted">
                              {category.description || '-'}
                            </small>
                          </td>
                          <td>
                            <span className="badge bg-info">
                              {category.transaction_count} giao dịch
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {formatDate(category.created_at)}
                            </small>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-secondary me-2"
                              onClick={() => openEdit(category)}
                            >
                              <i className="fas fa-pen"></i> Sửa
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              disabled={category.transaction_count > 0 || deletingId === category.id}
                              title={category.transaction_count > 0 ? 'Không thể xóa danh mục đang có giao dịch' : ''}
                              onClick={() => handleDelete(category)}
                            >
                              <i className="fas fa-trash"></i> Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-arrow-up fa-3x text-muted mb-3"></i>
                  <h6 className="text-muted">Chưa có danh mục thu nhập</h6>
                  <p className="text-muted">Thêm danh mục thu nhập để bắt đầu phân loại giao dịch.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expense Categories */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-danger text-white">
              <h5 className="mb-0">
                <i className="fas fa-arrow-down me-2"></i>
                Danh mục Chi tiêu ({expenseCategories.length})
              </h5>
            </div>
            <div className="card-body">
              {expenseCategories.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Tên danh mục</th>
                        <th>Mô tả</th>
                        <th>Số giao dịch</th>
                        <th>Ngày tạo</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenseCategories.map(category => (
                        <tr key={category.id}>
                          <td>{category.id}</td>
                          <td>
                            <strong className="text-danger">{category.name}</strong>
                          </td>
                          <td>
                            <small className="text-muted">
                              {category.description || '-'}
                            </small>
                          </td>
                          <td>
                            <span className="badge bg-info">
                              {category.transaction_count} giao dịch
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {formatDate(category.created_at)}
                            </small>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-secondary me-2"
                              onClick={() => openEdit(category)}
                            >
                              <i className="fas fa-pen"></i> Sửa
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              disabled={category.transaction_count > 0 || deletingId === category.id}
                              title={category.transaction_count > 0 ? 'Không thể xóa danh mục đang có giao dịch' : ''}
                              onClick={() => handleDelete(category)}
                            >
                              <i className="fas fa-trash"></i> Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-arrow-down fa-3x text-muted mb-3"></i>
                  <h6 className="text-muted">Chưa có danh mục chi tiêu</h6>
                  <p className="text-muted">Thêm danh mục chi tiêu để bắt đầu phân loại giao dịch.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Usage Guidelines */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Hướng dẫn sử dụng
              </h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-success">
                    <i className="fas fa-arrow-up me-1"></i>
                    Danh mục Thu nhập
                  </h6>
                  <ul className="list-unstyled">
                    <li><i className="fas fa-check text-success me-2"></i>Lương, thưởng</li>
                    <li><i className="fas fa-check text-success me-2"></i>Đầu tư, lãi suất</li>
                    <li><i className="fas fa-check text-success me-2"></i>Bán hàng, dịch vụ</li>
                    <li><i className="fas fa-check text-success me-2"></i>Thu nhập khác</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6 className="text-danger">
                    <i className="fas fa-arrow-down me-1"></i>
                    Danh mục Chi tiêu
                  </h6>
                  <ul className="list-unstyled">
                    <li><i className="fas fa-check text-danger me-2"></i>Ăn uống, sinh hoạt</li>
                    <li><i className="fas fa-check text-danger me-2"></i>Giao thông, xăng xe</li>
                    <li><i className="fas fa-check text-danger me-2"></i>Giải trí, mua sắm</li>
                    <li><i className="fas fa-check text-danger me-2"></i>Y tế, giáo dục</li>
                  </ul>
                </div>
              </div>
              <div className="alert alert-info mt-3 mb-0">
                <i className="fas fa-lightbulb me-2"></i>
                <strong>Lưu ý:</strong> Chỉ có thể xóa danh mục chưa có giao dịch nào. 
                Danh mục đã có giao dịch chỉ có thể chỉnh sửa tên và mô tả.
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal show={!!editingCategory} onHide={closeEdit} centered>
        <Modal.Header closeButton>
          <Modal.Title>Sửa danh mục</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editError && <Alert variant="danger">{editError}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tên danh mục</Form.Label>
              <Form.Control
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </Form.Group>
            {editingCategory && editingCategory.transaction_count > 0 && (
              <p className="text-muted small mb-0">
                <i className="fas fa-info-circle me-1"></i>
                Danh mục này đã có giao dịch nên không thể đổi loại (Thu nhập/Chi tiêu).
              </p>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeEdit} disabled={saving}>
            Hủy
          </Button>
          <Button variant="primary" onClick={saveEdit} disabled={saving || !editName.trim()}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
