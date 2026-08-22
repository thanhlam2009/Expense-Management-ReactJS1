import { Link } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import ReportModal from '../Reports/ReportModal';
import SpendingSuggestionsModal from './SpendingSuggestionsModal';
import { API_BASE_URL } from '../../services/api';

export default function QuickActions() {
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportType, setReportType] = useState<'monthly' | 'category' | 'yearly'>('monthly');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsData, setSuggestionsData] = useState<{
    needs: number;
    wants: number;
    savings: number;
    total_income: number;
  } | null>(null);

  const handleShowMonthlyReport = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/stats/monthly`, {
        withCredentials: true
      });
      console.log('Monthly report data:', response.data);
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        setReportData(response.data);
        setReportType('monthly');
        setShowReport(true);
      } else {
        alert('Không có dữ liệu báo cáo tháng này');
      }
    } catch (error) {
      console.error('Error loading monthly report:', error);
      alert('Lỗi khi tải báo cáo tháng');
    }
  };

  const handleShowSpendingSuggestions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/spending-suggestions`, {
        withCredentials: true
      });
      
      setSuggestionsData({
        needs: response.data.needs,
        wants: response.data.wants,
        savings: response.data.savings,
        total_income: response.data.total_income
      });
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error loading spending suggestions:', error);
      alert('Lỗi khi tải gợi ý chi tiêu');
    }
  };

  const handlePrintTransactions = () => {
    window.print();
  };

  const handleShareReport = () => {
    alert('Chức năng chia sẻ đang được phát triển');
  };

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-body text-center">
            <h5 className="mb-3">Thao tác nhanh</h5>
            <div className="row">
              <div className="col-md-3 mb-2">
                <Link to="/transactions/add" className="btn btn-primary w-100">
                  <i className="fas fa-plus me-2"></i>
                  Thêm giao dịch
                </Link>
              </div>
              <div className="col-md-3 mb-2">
                <Link to="/savings-goals" className="btn btn-warning w-100">
                  <i className="fas fa-target me-2"></i>
                  Mục tiêu tiết kiệm
                </Link>
              </div>
              <div className="col-md-3 mb-2">
                <Link to="/budget" className="btn btn-secondary w-100">
                  <i className="fas fa-wallet me-2"></i>
                  Giới hạn chi tiêu
                </Link>
              </div>
              <div className="col-md-3 mb-2">
                <button
                  type="button"
                  className="btn btn-info w-100"
                  onClick={handleShowMonthlyReport}
                >
                  <i className="fas fa-chart-bar me-2"></i>
                  Báo cáo tháng
                </button>
              </div>
              <div className="col-md-3 mb-2">
                <button
                  type="button"
                  className="btn btn-success w-100"
                  onClick={handleShowSpendingSuggestions}
                >
                  <i className="fas fa-lightbulb me-2"></i>
                  Gợi ý chi tiêu
                </button>
              </div>
            </div>

            {/* Export Actions Row */}
            <div className="row mt-3">
              <div className="col-md-3 mb-2">
                <a href={`${API_BASE_URL}/export/transactions`} className="btn btn-outline-success w-100">
                  <i className="fas fa-file-excel me-2"></i>
                  Export Excel
                </a>
              </div>
              <div className="col-md-3 mb-2">
                <a href={`${API_BASE_URL}/export/transactions/csv`} className="btn btn-outline-success w-100">
                  <i className="fas fa-file-csv me-2"></i>
                  Export CSV
                </a>
              </div>
              <div className="col-md-3 mb-2">
                <button
                  type="button"
                  className="btn btn-outline-primary w-100"
                  onClick={handlePrintTransactions}
                >
                  <i className="fas fa-print me-2"></i>
                  In báo cáo
                </button>
              </div>
              <div className="col-md-3 mb-2">
                <button
                  type="button"
                  className="btn btn-outline-info w-100"
                  onClick={handleShareReport}
                >
                  <i className="fas fa-share me-2"></i>
                  Chia sẻ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal 
        show={showReport}
        onHide={() => setShowReport(false)}
        title="Báo cáo tháng"
        data={reportData}
        type={reportType}
      />

      {/* Spending Suggestions Modal (50/30/20 Rule) */}
      {showSuggestions && suggestionsData && (
        <SpendingSuggestionsModal
          show={showSuggestions}
          onHide={() => setShowSuggestions(false)}
          needs={suggestionsData.needs}
          wants={suggestionsData.wants}
          savings={suggestionsData.savings}
          totalIncome={suggestionsData.total_income}
        />
      )}
    </div>
  );
}
