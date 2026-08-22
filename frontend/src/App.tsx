import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import TransactionsList from "./pages/TransactionsList";
import AddTransaction from "./pages/AddTransaction";
import EditTransaction from "./pages/EditTransaction";
import SavingsGoalsList from "./pages/SavingsGoalsList";
import AddSavingsGoal from "./pages/AddSavingsGoal";
import EditSavingsGoal from "./pages/EditSavingsGoal";
import BudgetSettings from "./pages/BudgetSettings";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AddCategory from "./pages/admin/AddCategory";

// Protected Route Component
function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !user.is_admin) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="transactions" element={<TransactionsList />} />
            <Route path="transactions/add" element={<AddTransaction />} />
            <Route path="transactions/edit/:id" element={<EditTransaction />} />
            <Route path="savings-goals" element={<SavingsGoalsList />} />
            <Route path="savings-goals/add" element={<AddSavingsGoal />} />
            <Route
              path="savings-goals/edit/:id"
              element={<EditSavingsGoal />}
            />
            <Route path="budget" element={<BudgetSettings />} />
            <Route path="profile" element={<Profile />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <ProtectedRoute adminOnly>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/categories"
              element={
                <ProtectedRoute adminOnly>
                  <AdminCategories />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/categories/add"
              element={
                <ProtectedRoute adminOnly>
                  <AddCategory />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/transactions"
              element={
                <ProtectedRoute adminOnly>
                  <AdminTransactions />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
