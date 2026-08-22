// Transactions List Page - Copy từ templates/transactions/index.html
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { transactionsAPI, API_BASE_URL } from '../services/api';
import Pagination from '../components/Pagination/Pagination';
import { formatCurrency } from '../utils/formatters';

interface Transaction {
  id: number;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: {
    id: number;
    name: string;
  };
  receipt_image?: string;
}

interface Category {
  id: number;
  name: string;
  type: string;
}

interface PaginationData {
  items: Transaction[];
  total: number;
  page: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export default function TransactionsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<PaginationData>({
    items: [],
    total: 0,
    page: 1,
    pages: 1,
    has_next: false,
    has_prev: false
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptModal, setReceiptModal] = useState<{ show: boolean; image: string }>({
    show: false,
    image: ''
  });

  // Get filter values from URL
  const type = searchParams.get('type') || '';
  const category = searchParams.get('category') || '';
  const dateFrom = searchParams.get('date_from') || '';
  const dateTo = searchParams.get('date_to') || '';
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    loadTransactions();
    loadCategories();
  }, [searchParams]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params: any = { page };
      if (type) params.type = type;
      if (category) params.category = category;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      // New API returns all data including categories
      const response = await transactionsAPI.getAll(params);
      
      setTransactions({
        items: response.transactions || [],
        total: response.total || 0,
        page: response.page || 1,
        pages: response.pages || 1,
        has_next: response.has_next || false,
        has_prev: response.has_prev || false
      });
      
      // Categories are included in the response
      if (response.categories && response.categories.length > 0) {
        setCategories(response.categories);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    // Categories are now loaded with transactions
    // This function kept for backwards compatibility but no longer needed
  };

  const handleFilterChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    params.delete('page'); // Reset to page 1 when filtering
    setSearchParams(params);
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form already updates via handleFilterChange
  };

  const handleClearFilters = () => {
    setSearchParams({});
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
      return;
    }

    try {
      await transactionsAPI.delete(id);
      loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Có lỗi xảy ra khi xóa giao dịch');
    }
  };

  const showReceipt = (filename: string) => {
    setReceiptModal({
      show: true,
      image: `${API_BASE_URL}/static/uploads/${filename}`
    });
  };

  const handleExport = async () => {
    try {
      // Call export endpoint
      window.location.href = `${API_BASE_URL}/export/transactions`;
    } catch (error) {
      console.error('Error exporting transactions:', error);
    }
  };

  const handleExportCsv = async () => {
    try {
      window.location.href = `${API_BASE_URL}/export/transactions/csv`;
    } catch (error) {
      console.error('Error exporting transactions (CSV):', error);
    }
  };

  return (
    <>
      <div className="row mb-4">
        <div className="col-md-8">
          <h2 className="fw-bold text-dark">
            <i className="fas fa-exchange-alt me-2"></i>
            Quản lý Giao dịch
          </h2>
          <p className="text-muted">Theo dõi và quản lý thu nhập, chi tiêu của bạn</p>
        </div>
        <div className="col-md-4 text-end">
          <div className="btn-group" role="group">
            <Link to="/transactions/add" className="btn btn-primary">
              <i className="fas fa-plus me-2"></i>
              Thêm giao dịch
            </Link>
            <button onClick={handleExport} className="btn btn-success">
              <i className="fas fa-file-excel me-2"></i>
              Export Excel
            </button>
            <button onClick={handleExportCsv} className="btn btn-outline-success">
              <i className="fas fa-file-csv me-2"></i>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-filter me-2"></i>
            Bộ lọc
          </h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleFilterSubmit} className="row g-3">
            <div className="col-md-3">
              <label htmlFor="type" className="form-label">Loại giao dịch</label>
              <select 
                className="form-select" 
                id="type" 
                value={type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="income">Thu nhập</option>
                <option value="expense">Chi tiêu</option>
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="category" className="form-label">Danh mục</label>
              <select 
                className="form-select" 
                id="category"
                value={category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">Tất cả</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label htmlFor="date_from" className="form-label">Từ ngày</label>
              <input 
                type="date" 
                className="form-control" 
                id="date_from"
                value={dateFrom}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label htmlFor="date_to" className="form-label">Đến ngày</label>
              <input 
                type="date" 
                className="form-control" 
                id="date_to"
                value={dateTo}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button type="submit" className="btn btn-primary me-2">
                <i className="fas fa-search me-1"></i>
                Lọc
              </button>
              <button 
                type="button" 
                onClick={handleClearFilters}
                className="btn btn-outline-secondary"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-list me-2"></i>
            Danh sách giao dịch
          </h5>
          <span className="badge bg-secondary">
            {transactions.total} giao dịch
          </span>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : transactions.items.length > 0 ? (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Loại</th>
                      <th>Danh mục</th>
                      <th>Mô tả</th>
                      <th className="text-end">Số tiền</th>
                      <th className="text-center">Hóa đơn</th>
                      <th className="text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.items.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{new Date(transaction.date).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <span className={`badge ${transaction.type === 'income' ? 'bg-success' : 'bg-danger'}`}>
                            <i className={`fas fa-arrow-${transaction.type === 'income' ? 'up' : 'down'} me-1`}></i>
                            {transaction.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                          </span>
                        </td>
                        <td>{transaction.category.name}</td>
                        <td>
                          {transaction.description ? (
                            <>
                              {transaction.description.substring(0, 50)}
                              {transaction.description.length > 50 && '...'}
                            </>
                          ) : (
                            <span className="text-muted">Không có mô tả</span>
                          )}
                        </td>
                        <td className="text-end">
                          <span className={`fw-bold ${transaction.type === 'income' ? 'text-success' : 'text-danger'}`}>
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="text-center">
                          {transaction.receipt_image ? (
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-info"
                              onClick={() => showReceipt(transaction.receipt_image!)}
                            >
                              <i className="fas fa-image"></i>
                            </button>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm">
                            <Link 
                              to={`/transactions/edit/${transaction.id}`}
                              className="btn btn-outline-warning"
                            >
                              <i className="fas fa-edit"></i>
                            </Link>
                            <button 
                              type="button"
                              onClick={() => handleDelete(transaction.id)}
                              className="btn btn-outline-danger"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <Pagination 
                currentPage={transactions.page}
                totalPages={transactions.pages}
                hasNext={transactions.has_next}
                hasPrev={transactions.has_prev}
              />
            </>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-inbox fa-4x text-muted mb-3"></i>
              <h5 className="text-muted">Không có giao dịch nào</h5>
              <p className="text-muted">Hãy thêm giao dịch đầu tiên của bạn</p>
              <Link to="/transactions/add" className="btn btn-primary">
                <i className="fas fa-plus me-2"></i>
                Thêm giao dịch
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {receiptModal.show && (
        <div 
          className="modal fade show" 
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setReceiptModal({ show: false, image: '' })}
        >
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Hóa đơn</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setReceiptModal({ show: false, image: '' })}
                ></button>
              </div>
              <div className="modal-body text-center">
                <img src={receiptModal.image} alt="Receipt" className="img-fluid" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
