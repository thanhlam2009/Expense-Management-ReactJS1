// Dashboard Page - Copy chính xác từ dashboard.html structure
import { useEffect, useState } from 'react';
import StatsCards from '../components/Dashboard/StatsCards';
import BudgetAlertCard from '../components/Dashboard/BudgetAlertCard';
import MonthlyChart from '../components/Charts/MonthlyChart';
import MonthlyStats from '../components/Dashboard/MonthlyStats';
import RecentTransactions from '../components/Dashboard/RecentTransactions';
import CategorySpendingCard from '../components/Dashboard/CategorySpendingCard';
import PredictionCard from '../components/Dashboard/PredictionCard';
import SavingsGoalsSection from '../components/Dashboard/SavingsGoalsSection';
import MonthlyAnalysis from '../components/Dashboard/MonthlyAnalysis';
import AdvancedAnalysis from '../components/AdvancedAnalysis';
import QuickActions from '../components/Dashboard/QuickActions';
import { statsAPI } from '../services/api';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [chartPeriod, setChartPeriod] = useState('6m');

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadMonthlyData();
  }, [chartPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL dashboard data in one request - exactly like HTML dashboard
      const response = await statsAPI.getDashboardData();
      const data = response.data;
      
      setDashboardData({
        total_income: data.total_income || 0,
        total_expense: data.total_expense || 0,
        balance: data.balance || 0,
        monthly_income: data.monthly_income || 0,
        monthly_expense: data.monthly_expense || 0,
        recent_transactions: data.recent_transactions || [],
        category_spending: data.category_spending || [],
        savings_goals: data.savings_goals || [],
        budget_alert: data.budget_alert
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyData = async () => {
    try {
      const months = chartPeriod === '3m' ? 3 : chartPeriod === '12m' ? 12 : 6;
      const res = await statsAPI.monthly(months);
      setMonthlyData(res.data);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    }
  };

  const handleChangePeriod = (period: string) => {
    setChartPeriod(period);
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

  if (!dashboardData) {
    return <div>Error loading dashboard</div>;
  }

  return (
    <>
      {/* Header - Copy từ dashboard.html */}
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="fw-bold text-dark">
            <i className="fas fa-tachometer-alt me-2"></i>
            Dashboard
          </h2>
          <p className="text-muted">
            Xin chào, User! Đây là tổng quan tài chính của bạn.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards
        totalIncome={dashboardData.total_income}
        totalExpense={dashboardData.total_expense}
        balance={dashboardData.balance}
        savingsGoalProgress={
          dashboardData.savings_goals && dashboardData.savings_goals.length > 0
            ? dashboardData.savings_goals[0].progress_percentage
            : undefined
        }
      />

      {/* Budget Alert - Hidden for now */}
      {/* <BudgetAlertCard budgetAlert={dashboardData.budget_alert} /> */}

      {/* Monthly Stats */}
      <div className="row mb-4">
        <div className="col-md-8 mb-4">
          <MonthlyChart
            data={monthlyData}
            onChangePeriod={handleChangePeriod}
            currentPeriod={chartPeriod}
          />
        </div>
        
        <div className="col-md-4 mb-4">
          <MonthlyStats
            monthlyIncome={dashboardData.monthly_income}
            monthlyExpense={dashboardData.monthly_expense}
          />
        </div>
      </div>

      {/* Recent Transactions and Category Spending */}
      <div className="row mb-4">
        <div className="col-lg-6 mb-4">
          <RecentTransactions transactions={dashboardData.recent_transactions} />
        </div>
        
        <div className="col-lg-6 mb-4">
          <CategorySpendingCard categorySpending={dashboardData.category_spending} />
        </div>
      </div>

      {/* Prediction */}
      <div className="row mb-4">
        <div className="col-12">
          <PredictionCard />
        </div>
      </div>

      {/* Savings Goals */}
      <SavingsGoalsSection savingsGoals={dashboardData.savings_goals} />

      {/* Monthly Analysis */}
      <MonthlyAnalysis />

      {/* Advanced Analysis */}
      <AdvancedAnalysis />

      {/* Quick Actions */}
      <QuickActions />
    </>
  );
}
