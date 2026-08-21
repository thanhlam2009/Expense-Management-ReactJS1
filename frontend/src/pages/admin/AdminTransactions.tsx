// Admin Transactions Page - Copy từ templates/admin/transactions.html
import { useState, useEffect } from "react";
import { formatCurrency } from "../../utils/formatters";
import { API_BASE_URL } from "../../services/api";

interface Transaction {
  id: number;
  user: {
    id: number;
    full_name: string;
    email: string;
  };
  type: string;
  category?: {
    id: number;
    name: string;
  };
  amount: number;
  description?: string;
  date: string;
  created_at: string;
  receipt_image?: string;
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState("");

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual admin API endpoint
      const response = await fetch(
        `${API_BASE_URL}/api/admin/transactions`,
        {
          credentials: "include",
        },
      );

      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const viewReceipt = (imagePath: string) => {
    setSelectedReceipt(imagePath);
    setShowReceiptModal(true);
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filterType && t.type !== filterType) return false;
    if (filterUser && t.user.id.toString() !== filterUser) return false;
    return true;
  });

  const incomeTransactions = filteredTransactions.filter(
    (t) => t.type === "income",
  );
  const expenseTransactions = filteredTransactions.filter(
    (t) => t.type === "expense",
  );
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTransactions.reduce(
    (sum, t) => sum + t.amount,
    0,
  );

  // Get unique users for filter
  const uniqueUsers = Array.from(
    new Set(
      transactions.map((t) =>
        JSON.stringify({ id: t.user.id, full_name: t.user.full_name }),
      ),
    ),
  ).map((str) => JSON.parse(str));

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
            <i className="fas fa-exchange-alt me-2"></i>
            Quản lý Giao dịch
          </h2>
          <p className="text-muted">
            Xem và quản lý tất cả giao dịch trong hệ thống
          </p>
        </div>
      </div>

      {/* Transactions Statistics */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card stats-card">
            <div className="card-body text-center">
              <div className="icon text-info">
                <i className="fas fa-exchange-alt"></i>
              </div>
              <div className="amount text-info">
                {filteredTransactions.length}
              </div>
              <div className="label">Tổng giao dịch</div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card stats-card">
            <div className="card-body text-center">
              <div className="icon text-success">
                <i className="fas fa-arrow-up"></i>
              </div>
              <div className="amount text-success">
                {incomeTransactions.length}
              </div>
              <div className="label">Thu nhập</div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card stats-card">
            <div className="card-body text-center">
              <div className="icon text-danger">
                <i className="fas fa-arrow-down"></i>
              </div>
              <div className="amount text-danger">
                {expenseTransactions.length}
              </div>
              <div className="label">Chi tiêu</div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card stats-card">
            <div className="card-body text-center">
              <div className="icon text-primary">
                <i className="fas fa-balance-scale"></i>
              </div>
              <div className="amount text-primary">
                {formatCurrency(totalIncome - totalExpense)}
              </div>
              <div className="label">Số dư</div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Danh sách Giao dịch
              </h5>
              <div className="d-flex gap-2">
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto" }}
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">Tất cả loại</option>
                  <option value="income">Thu nhập</option>
                  <option value="expense">Chi tiêu</option>
                </select>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto" }}
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                >
                  <option value="">Tất cả người dùng</option>
                  {uniqueUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="card-body">
              {filteredTransactions.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Người dùng</th>
                        <th>Loại</th>
                        <th>Danh mục</th>
                        <th>Số tiền</th>
                        <th>Mô tả</th>
                        <th>Ngày GD</th>
                        <th>Ngày tạo</th>
                        <th>Hóa đơn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td>{transaction.id}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2">
                                {transaction.user.full_name[0].toUpperCase()}
                              </div>
                              <div>
                                <strong>{transaction.user.full_name}</strong>
                                <br />
                                <small className="text-muted">
                                  {transaction.user.email}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            {transaction.type === "income" ? (
                              <span className="badge bg-success">
                                <i className="fas fa-arrow-up me-1"></i>Thu nhập
                              </span>
                            ) : (
                              <span className="badge bg-danger">
                                <i className="fas fa-arrow-down me-1"></i>Chi
                                tiêu
                              </span>
                            )}
                          </td>
                          <td>
                            <span className="badge bg-info">
                              {transaction.category?.name || "Không có"}
                            </span>
                          </td>
                          <td>
                            <strong
                              className={
                                transaction.type === "income"
                                  ? "text-success"
                                  : "text-danger"
                              }
                            >
                              {transaction.type === "income" ? "+" : "-"}
                              {formatCurrency(transaction.amount)}
                            </strong>
                          </td>
                          <td>
                            <div
                              className="text-truncate"
                              style={{ maxWidth: "200px" }}
                              title={transaction.description}
                            >
                              {transaction.description || "-"}
                            </div>
                          </td>
                          <td>
                            <small className="text-muted">
                              {formatDate(transaction.date)}
                            </small>
                          </td>
                          <td>
                            <small className="text-muted">
                              {formatDateTime(transaction.created_at)}
                            </small>
                          </td>
                          <td>
                            {transaction.receipt_image ? (
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  viewReceipt(transaction.receipt_image!)
                                }
                                title="Xem hóa đơn"
                              >
                                <i className="fas fa-image"></i>
                              </button>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-exchange-alt fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">Không có giao dịch nào</h5>
                  <p className="text-muted">
                    Chưa có giao dịch nào trong hệ thống.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-image me-2"></i>
                  Hóa đơn
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowReceiptModal(false)}
                ></button>
              </div>
              <div className="modal-body text-center">
                <img
                  src={`${API_BASE_URL}/static/uploads/${selectedReceipt}`}
                  alt="Hóa đơn"
                  className="img-fluid rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
