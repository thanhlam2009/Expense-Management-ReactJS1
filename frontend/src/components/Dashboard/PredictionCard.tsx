import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { formatCurrency } from '../../utils/formatters';
import { formatNumber, getMethodName, getAccuracyBadgeColor, type PredictionData } from '../../utils/prediction';

const PredictionCard: React.FC = () => {
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadPrediction();
  }, []);

  const loadPrediction = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/predict-spending', { withCredentials: true });
      setPredictionData(response.data);
    } catch (err: any) {
      console.error('Error loading prediction:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.message || 'Không thể dự đoán chi tiêu');
      } else {
        setError('Có lỗi xảy ra khi tải dự đoán');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card border-info">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-info" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-2 text-muted">Đang phân tích dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !predictionData || predictionData.error || !predictionData.recommended_prediction || !predictionData.current_month) {
    return (
      <div className="card border-warning">
        <div className="card-body">
          <div className="alert alert-warning text-center mb-0">
            <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
            <h5>Không thể dự đoán</h5>
            <p className="mb-3">{error || predictionData?.message || 'Cần ít nhất 2 tháng dữ liệu để dự đoán'}</p>
            <a href="/transactions/add" className="btn btn-primary">
              <i className="fas fa-plus me-2"></i>
              Thêm giao dịch
            </a>
          </div>
        </div>
      </div>
    );
  }

  const prediction = predictionData.recommended_prediction;
  const currentMonth = predictionData.current_month;

  return (
    <div className="card border-info">
      <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="fas fa-crystal-ball me-2"></i>
          Dự đoán chi tiêu
        </h5>
        <button
          className="btn btn-light btn-sm"
          onClick={loadPrediction}
        >
          <i className="fas fa-sync-alt me-1"></i>
          Cập nhật
        </button>
      </div>
      <div className="card-body">
        {/* Main Prediction */}
        <div className="row align-items-center mb-3">
          <div className="col-md-8">
            <h6 className="mb-2">
              <i className="fas fa-calendar-alt me-2"></i>
              Tháng {currentMonth.month}/{currentMonth.year}
            </h6>
            <h3 className="text-primary mb-2">{formatCurrency(prediction.predicted_amount)}</h3>
            <p className="mb-1">
              <strong>Phương pháp:</strong> {getMethodName(prediction.method)}
              {prediction.accuracy && (
                <span className={`badge ms-2 bg-${getAccuracyBadgeColor(prediction.accuracy)}`}>
                  {prediction.accuracy}
                </span>
              )}
            </p>
            <small className="text-muted">
              <i className="fas fa-lightbulb me-1"></i>
              {prediction.recommended_reason}
            </small>
          </div>
          <div className="col-md-4 text-center">
            <div className="mb-2">
              <small className="text-muted">Dựa trên {prediction.months_used} tháng gần nhất</small>
            </div>
            {prediction.historical_data && prediction.historical_data.length > 0 && (
              <div className="d-flex justify-content-center flex-wrap gap-2">
                {prediction.historical_data.slice(0, 3).map((month, idx) => (
                  <div key={idx} className="text-center">
                    <small className="text-muted d-block">{month.month_name}</small>
                    <strong className="text-danger">{formatNumber(month.amount / 1000)}K</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Details Button */}
        <div className="text-center">
          <button
            className="btn btn-outline-info btn-sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            <i className={`fas fa-chevron-${showDetails ? 'up' : 'down'} me-2`}></i>
            {showDetails ? 'Ẩn chi tiết' : 'Xem tất cả phương pháp'}
          </button>
        </div>

        {/* All Predictions Details */}
        {showDetails && predictionData.all_predictions && (
          <div className="mt-3">
            <hr />
            <h6 className="mb-3">Tất cả các phương pháp dự đoán:</h6>
            <div className="row">
              {Object.entries(predictionData.all_predictions).map(([method, pred]) => (
                <div key={method} className="col-md-4 mb-3">
                  <div
                    className={`card h-100 ${
                      method === prediction.method ? 'border-primary' : ''
                    }`}
                  >
                    <div className="card-body text-center">
                      <h6 className="card-title">{getMethodName(method)}</h6>
                      <h4 className="text-primary mb-2">
                        {formatCurrency(pred.predicted_amount)}
                      </h4>
                      {method === prediction.method && (
                        <span className="badge bg-primary mb-2">Khuyến nghị</span>
                      )}
                      {pred.accuracy && (
                        <div className="mt-2">
                          <span className={`badge bg-${getAccuracyBadgeColor(pred.accuracy)}`}>
                            {pred.accuracy}
                          </span>
                        </div>
                      )}
                      <small className="text-muted d-block mt-2">
                        Dựa trên {pred.months_used} tháng
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendation Info */}
            <div className="alert alert-info mb-0">
              <i className="fas fa-info-circle me-2"></i>
              <strong>Lưu ý:</strong> Dự đoán dựa trên lịch sử chi tiêu của bạn. 
              Các yếu tố khác như sự kiện đặc biệt, thay đổi thu nhập có thể ảnh hưởng đến chi tiêu thực tế.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionCard;
