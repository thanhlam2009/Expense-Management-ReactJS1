import { useState, useEffect } from "react";
import axios from "axios";
import { formatCurrency } from "../../utils/formatters";
import { API_BASE_URL } from "../../services/api";

interface MonthData {
  month: number;
  year: number;
  month_name: string;
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

export default function MonthlyAnalysis() {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<"3months" | "6months" | "all">(
    "6months",
  );
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, [period]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      // Call same API as HTML version
      const res = await axios.get(`${API_BASE_URL}/api/stats/all-months`, {
        withCredentials: true,
      });
      const allMonthsData: MonthData[] = res.data.months_data || [];

      // Calculate averages exactly like HTML version
      const result = calculateMonthlyAverages(allMonthsData, period);
      setAnalysisData(result);
    } catch (error) {
      console.error("Error loading analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyAverages = (
    monthsData: MonthData[],
    filterMode: string,
  ): AnalysisResult => {
    if (!monthsData || monthsData.length === 0) {
      return {
        average_income: 0,
        average_expense: 0,
        average_balance: 0,
        months_included: 0,
        months_analyzed: [],
        period_summary: {
          total_income: 0,
          total_expense: 0,
          total_balance: 0,
        },
      };
    }

    // Filter out current month (QUAN TRỌNG - giống HTML!)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const filteredData = monthsData.filter((month) => {
      return !(month.year === currentYear && month.month === currentMonth);
    });

    if (filteredData.length === 0) {
      return {
        average_income: 0,
        average_expense: 0,
        average_balance: 0,
        months_included: 0,
        months_analyzed: [],
        period_summary: {
          total_income: 0,
          total_expense: 0,
          total_balance: 0,
        },
      };
    }

    // Sort by year and month (newest first)
    const sortedData = filteredData.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    // Apply filter based on mode
    let dataToAnalyze: MonthData[] = [];
    switch (filterMode) {
      case "3months":
        dataToAnalyze = sortedData.slice(0, 3);
        break;
      case "6months":
        dataToAnalyze = sortedData.slice(0, 6);
        break;
      case "all":
      default:
        dataToAnalyze = sortedData;
        break;
    }

    // Calculate averages
    const totalIncome = dataToAnalyze.reduce(
      (sum, month) => sum + month.income,
      0,
    );
    const totalExpense = dataToAnalyze.reduce(
      (sum, month) => sum + month.expense,
      0,
    );
    const totalBalance = dataToAnalyze.reduce(
      (sum, month) => sum + month.balance,
      0,
    );

    const monthsCount = dataToAnalyze.length;

    return {
      average_income: Math.round(totalIncome / monthsCount),
      average_expense: Math.round(totalExpense / monthsCount),
      average_balance: Math.round(totalBalance / monthsCount),
      months_included: monthsCount,
      months_analyzed: dataToAnalyze.map((m) => `${m.month_name} ${m.year}`),
      period_summary: {
        total_income: totalIncome,
        total_expense: totalExpense,
        total_balance: totalBalance,
      },
    };
  };

  const handleChangePeriod = (newPeriod: "3months" | "6months" | "all") => {
    setPeriod(newPeriod);
  };

  return (
    <div className="row mb-4">
      <div className="col-12">
        <div className="card border-info">
          <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="fas fa-calculator me-2"></i>
              📊 Phân tích thu chi trung bình
            </h5>
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                className={`btn ${period === "3months" ? "btn-light" : "btn-outline-light"}`}
                onClick={() => handleChangePeriod("3months")}
              >
                3 tháng
              </button>
              <button
                type="button"
                className={`btn ${period === "6months" ? "btn-light" : "btn-outline-light"}`}
                onClick={() => handleChangePeriod("6months")}
              >
                6 tháng
              </button>
              <button
                type="button"
                className={`btn ${period === "all" ? "btn-light" : "btn-outline-light"}`}
                onClick={() => handleChangePeriod("all")}
              >
                Tất cả
              </button>
            </div>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center">
                <div className="spinner-border text-info" role="status"></div>
                <p className="mt-2 text-muted">Đang tải dữ liệu phân tích...</p>
              </div>
            ) : analysisData && analysisData.months_included > 0 ? (
              <>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <div className="text-center p-3 border rounded bg-light">
                      <h4 className="text-success mb-2">
                        {formatCurrency(analysisData.average_income)}
                      </h4>
                      <p className="mb-1 fw-bold">Trung bình thu nhập</p>
                      <small className="text-muted">
                        Tổng:{" "}
                        {formatCurrency(
                          analysisData.period_summary.total_income,
                        )}
                      </small>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="text-center p-3 border rounded bg-light">
                      <h4 className="text-danger mb-2">
                        {formatCurrency(analysisData.average_expense)}
                      </h4>
                      <p className="mb-1 fw-bold">Trung bình chi tiêu</p>
                      <small className="text-muted">
                        Tổng:{" "}
                        {formatCurrency(
                          analysisData.period_summary.total_expense,
                        )}
                      </small>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="text-center p-3 border rounded bg-light">
                      <h4
                        className={`${analysisData.average_balance >= 0 ? "text-primary" : "text-warning"} mb-2`}
                      >
                        {formatCurrency(analysisData.average_balance)}
                      </h4>
                      <p className="mb-1 fw-bold">Trung bình số dư</p>
                      <small className="text-muted">
                        Tổng:{" "}
                        {formatCurrency(
                          analysisData.period_summary.total_balance,
                        )}
                      </small>
                    </div>
                  </div>
                </div>
                <hr />
                <div className="row">
                  <div className="col-md-6">
                    <p className="mb-1">
                      <strong>Khoảng thời gian:</strong>{" "}
                      {period === "3months"
                        ? "3 tháng gần nhất"
                        : period === "6months"
                          ? "6 tháng gần nhất"
                          : "Tất cả các tháng"}
                    </p>
                    <p className="mb-1">
                      <strong>Số tháng phân tích:</strong>{" "}
                      {analysisData.months_included} tháng
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-1">
                      <strong>Các tháng:</strong>
                    </p>
                    <small className="text-muted">
                      {analysisData.months_analyzed.join(", ")}
                    </small>
                  </div>
                </div>
              </>
            ) : (
              <div className="alert alert-warning text-center">
                <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
                <h5>Chưa có dữ liệu</h5>
                <p>Cần ít nhất 1 tháng dữ liệu để thực hiện phân tích</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
