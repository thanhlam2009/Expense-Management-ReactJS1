// Navbar Component - Copy chính xác từ base.html
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import ReportModal from "../Reports/ReportModal";
import axios from "axios";
import { API_BASE_URL } from "../../services/api";

interface NavbarProps {
  currentUser: any; // Sẽ type đúng sau
}

export default function Navbar({ currentUser }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [reportModal, setReportModal] = useState<{
    show: boolean;
    title: string;
    data: any[];
    type: "monthly" | "category" | "yearly";
  }>({
    show: false,
    title: "",
    data: [],
    type: "monthly",
  });

  const isActive = (path: string) => {
    return location.pathname.startsWith(path) ? "active" : "";
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const showMonthlyReport = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${API_BASE_URL}/api/stats/monthly`, {
        withCredentials: true,
      });
      console.log("Monthly report response:", response.data);
      const reportData = Array.isArray(response.data) ? response.data : [];
      setReportModal({
        show: true,
        title: "Báo cáo theo tháng",
        data: reportData,
        type: "monthly",
      });
    } catch (error) {
      console.error("Error loading monthly report:", error);
    }
  };

  const showCategoryReport = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${API_BASE_URL}/api/stats/categories`, {
        withCredentials: true,
      });
      console.log("Category report response:", response.data);
      const reportData = Array.isArray(response.data) ? response.data : [];
      setReportModal({
        show: true,
        title: "Báo cáo theo danh mục",
        data: reportData,
        type: "category",
      });
    } catch (error) {
      console.error("Error loading category report:", error);
    }
  };

  const showYearlyReport = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/stats/monthly?months=12`,
        {
          withCredentials: true,
        },
      );
      console.log("Yearly report response:", response.data);
      const reportData = Array.isArray(response.data) ? response.data : [];
      setReportModal({
        show: true,
        title: "Báo cáo theo năm",
        data: reportData,
        type: "yearly",
      });
    } catch (error) {
      console.error("Error loading yearly report:", error);
    }
  };

  const closeReportModal = () => {
    setReportModal({ show: false, title: "", data: [], type: "monthly" });
  };

  if (!currentUser) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to="/dashboard">
          <i className="fas fa-chart-line me-2"></i>Chi tiêu
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link
                className={`nav-link ${location.pathname === "/dashboard" ? "active" : ""}`}
                to="/dashboard"
              >
                <i className="fas fa-tachometer-alt me-1"></i>Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive("/transactions")}`}
                to="/transactions"
              >
                <i className="fas fa-exchange-alt me-1"></i>Giao dịch
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/savings-goals">
                <i className="fas fa-piggy-bank me-1"></i>Mục tiêu
              </Link>
            </li>
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
              >
                <i className="fas fa-chart-bar me-1"></i>Báo cáo
              </a>
              <ul className="dropdown-menu">
                <li>
                  <a
                    className="dropdown-item"
                    href="#"
                    onClick={showMonthlyReport}
                  >
                    Theo tháng
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="#"
                    onClick={showCategoryReport}
                  >
                    Theo danh mục
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="#"
                    onClick={showYearlyReport}
                  >
                    Theo năm
                  </a>
                </li>
              </ul>
            </li>
            {currentUser.is_admin && (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                >
                  <i className="fas fa-cog me-1"></i>Quản trị
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <Link className="dropdown-item" to="/admin">
                      Dashboard Admin
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/admin/users">
                      Người dùng
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/admin/categories">
                      Danh mục
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/admin/transactions">
                      Giao dịch
                    </Link>
                  </li>
                </ul>
              </li>
            )}
          </ul>

          <ul className="navbar-nav">
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
              >
                <i className="fas fa-user me-1"></i>
                {currentUser.full_name}
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <Link className="dropdown-item" to="/profile">
                    <i className="fas fa-user-edit me-2"></i>Hồ sơ
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                  >
                    <i className="fas fa-sign-out-alt me-2"></i>Đăng xuất
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        show={reportModal.show}
        onHide={closeReportModal}
        title={reportModal.title}
        data={reportModal.data}
        type={reportModal.type}
      />
    </nav>
  );
}
