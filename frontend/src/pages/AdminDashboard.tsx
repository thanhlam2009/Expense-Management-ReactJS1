import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';

interface StatsData {
  total_users: number;
  total_transactions: number;
  total_income: number;
  total_expense: number;
}

interface User {
  id: number;
  email: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
}

interface TopCategory {
  category: string;
  amount: number;
}

interface MonthData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

interface AnalysisResult {
  average_income: number;
  average_expense: number;
  average_balance: number;
  months_included: number;
  months_analyzed: string[];
  period_summary: {
    total_income: number;
    total_expense: number;
    total_balance: number;
  };
}

interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable';
  trend_description: string;
  monthly_changes: Array<{
    month: string;
    change: number;
    percent: number;
  }>;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<StatsData>({
    total_users: 0,
    total_transactions: 0,
    total_income: 0,
    total_expense: 0
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [allMonthsData, setAllMonthsData] = useState<MonthData[]>([]);
  const [analysisMode, setAnalysisMode] = useState<'3months' | '6months' | 'all'>('6months');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (allMonthsData.length > 0) {
      calculateAnalysis();
    }
  }, [analysisMode, allMonthsData]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load stats, users, categories in parallel
      const [statsRes, usersRes, categoriesRes, monthsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/stats`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/api/admin/recent-users`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/api/admin/top-categories`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/api/stats/all-months`, { withCredentials: true })
      ]);

      setStats(statsRes.data);
      setRecentUsers(usersRes.data.users || []);
      setTopCategories(categoriesRes.data.categories || []);
      setAllMonthsData(monthsRes.data.months_data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalysis = () => {
    if (allMonthsData.length === 0) return;

    let dataToAnalyze = [...allMonthsData];
    
    // Filter by mode
    if (analysisMode === '3months') {
      dataToAnalyze = dataToAnalyze.slice(-3);
    } else if (analysisMode === '6months') {
      dataToAnalyze = dataToAnalyze.slice(-6);
    }

    const totalIncome = dataToAnalyze.reduce((sum, m) => sum + m.income, 0);
    const totalExpense = dataToAnalyze.reduce((sum, m) => sum + m.expense, 0);
    const totalBalance = totalIncome - totalExpense;

    const result: AnalysisResult = {
      average_income: totalIncome / dataToAnalyze.length,
      average_expense: totalExpense / dataToAnalyze.length,
      average_balance: totalBalance / dataToAnalyze.length,
      months_included: dataToAnalyze.length,
      months_analyzed: dataToAnalyze.map(m => m.month),
      period_summary: {
        total_income: totalIncome,
        total_expense: totalExpense,
        total_balance: totalBalance
      }
    };

    setAnalysisResult(result);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
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
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <i className="fas fa-users fa-3x text-primary mb-3"></i>
              <h3 className="text-primary">{stats.total_users}</h3>
              <p className="text-muted mb-0">Tổng người dùng</p>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <i className="fas fa-exchange-alt fa-3x text-info mb-3"></i>
              <h3 className="text-info">{stats.total_transactions}</h3>
              <p className="text-muted mb-0">Tổng giao dịch</p>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <i className="fas fa-arrow-up fa-3x text-success mb-3"></i>
              <h3 className="text-success">{formatCurrency(stats.total_income)}</h3>
              <p className="text-muted mb-0">Tổng thu nhập</p>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <i className="fas fa-arrow-down fa-3x text-danger mb-3"></i>
              <h3 className="text-danger">{formatCurrency(stats.total_expense)}</h3>
              <p className="text-muted mb-0">Tổng chi tiêu</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Recent Users */}
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center bg-white">
              <h5 className="mb-0">
                <i className="fas fa-user-plus me-2"></i>
                Người dùng mới nhất
              </h5>
            </div>
            <div className="card-body">
              {recentUsers.length > 0 ? (
                recentUsers.map(user => (
                  <div key={user.id} className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                    <div>
                      <h6 className="mb-1">{user.full_name}</h6>
                      <small className="text-muted">
                        {user.email}
                        {user.is_admin && (
                          <span className="badge bg-warning ms-2">Admin</span>
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
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0">
                <i className="fas fa-chart-pie me-2"></i>
                Danh mục chi tiêu hàng đầu
              </h5>
            </div>
            <div className="card-body">
              {topCategories.length > 0 ? (
                topCategories.map((cat, idx) => (
                  <div key={idx} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>{cat.category}</span>
                      <span className="fw-bold text-danger">{formatCurrency(cat.amount)}</span>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div 
                        className="progress-bar bg-primary" 
                        style={{ width: `${(cat.amount / topCategories[0].amount) * 100}%` }}
                      ></div>
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
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center bg-white">
              <h5 className="mb-0">
                <i className="fas fa-chart-line me-2"></i>
                Phân tích thu chi trung bình
              </h5>
              <div className="btn-group">
                <button 
                  className={`btn btn-sm ${analysisMode === '3months' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setAnalysisMode('3months')}
                >
                  3 tháng
                </button>
                <button 
                  className={`btn btn-sm ${analysisMode === '6months' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setAnalysisMode('6months')}
                >
                  6 tháng
                </button>
                <button 
                  className={`btn btn-sm ${analysisMode === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setAnalysisMode('all')}
                >
                  Tất cả
                </button>
              </div>
            </div>
            <div className="card-body">
              {analysisResult ? (
                <>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <div className="text-center p-3 border rounded bg-light">
                        <h4 className="text-success mb-2">{formatCurrency(analysisResult.average_income)}</h4>
                        <p className="mb-1 fw-bold">Trung bình thu nhập</p>
                        <small className="text-muted">Tổng: {formatCurrency(analysisResult.period_summary.total_income)}</small>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="text-center p-3 border rounded bg-light">
                        <h4 className="text-danger mb-2">{formatCurrency(analysisResult.average_expense)}</h4>
                        <p className="mb-1 fw-bold">Trung bình chi tiêu</p>
                        <small className="text-muted">Tổng: {formatCurrency(analysisResult.period_summary.total_expense)}</small>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="text-center p-3 border rounded bg-light">
                        <h4 className={`${analysisResult.average_balance >= 0 ? 'text-primary' : 'text-warning'} mb-2`}>
                          {formatCurrency(analysisResult.average_balance)}
                        </h4>
                        <p className="mb-1 fw-bold">Trung bình số dư</p>
                        <small className="text-muted">Tổng: {formatCurrency(analysisResult.period_summary.total_balance)}</small>
                      </div>
                    </div>
                  </div>
                  <hr />
                  <div className="row">
                    <div className="col-md-6">
                      <p className="mb-1"><strong>Số tháng phân tích:</strong> {analysisResult.months_included} tháng</p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-1"><strong>Các tháng:</strong></p>
                      <small className="text-muted">{analysisResult.months_analyzed.join(', ')}</small>
                    </div>
                  </div>
                </>
              ) : (
                <div className="alert alert-warning text-center">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Chưa có dữ liệu để phân tích
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
