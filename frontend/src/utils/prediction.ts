// Prediction utilities

export interface PredictionMethod {
  method: string;
  predicted_amount: number;
  accuracy?: 'High' | 'Medium' | 'Low';
  months_used: number;
  recommended_reason?: string;
  historical_data: Array<{
    month_name: string;
    amount: number;
  }>;
}

export interface PredictionData {
  error?: boolean;
  message?: string;
  recommended_prediction: PredictionMethod;
  current_month: {
    month: number;
    year: number;
    month_name: string;
  };
  all_predictions: {
    [key: string]: PredictionMethod;
  };
}

export function formatNumber(number: number): string {
  return new Intl.NumberFormat('vi-VN').format(number);
}

export function getMethodName(method: string): string {
  const methods: Record<string, string> = {
    'simple_average': 'Trung bình đơn giản',
    'weighted_average': 'Trung bình có trọng số',
    'linear_regression': 'Hồi quy tuyến tính'
  };
  return methods[method] || method;
}

export function getAccuracyBadgeColor(accuracy: string): string {
  const colors: Record<string, string> = {
    'High': 'success',
    'Medium': 'warning',
    'Low': 'danger'
  };
  return colors[accuracy] || 'secondary';
}
