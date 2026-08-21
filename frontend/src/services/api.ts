// API Service - Tất cả API calls tập trung tại đây
import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Để gửi cookie session
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth APIs
export const authAPI = {
  login: (email: string, password: string, remember: boolean) =>
    api.post("/auth/login", { email, password, remember }),

  register: (data: {
    email: string;
    full_name: string;
    password: string;
    confirm_password: string;
  }) => api.post("/auth/register", data),

  verifyEmail: (email: string, code: string) =>
    api.post("/auth/verify-email", { email, code }),

  resendVerification: (email: string) =>
    api.post("/auth/resend-verification", { email }),

  logout: () => api.get("/auth/logout"),
};

// Transactions APIs
export const transactionsAPI = {
  // Get transactions with pagination and filters - matches HTML
  getAll: (params?: any) =>
    api.get("/api/transactions/list", { params }).then((res) => res.data),

  // Get simple list without pagination
  getSimpleList: () => api.get("/api/transactions"),

  getById: (id: number) => api.get(`/api/transactions/${id}`),

  create: (data: any) => api.post("/api/transactions", data),

  update: (id: number, data: any) => api.put(`/api/transactions/${id}`, data),

  delete: (id: number) => api.delete(`/api/transactions/${id}`),

  getCategories: () => api.get("/api/categories"),

  extractReceipt: (formData: FormData) =>
    api.post("/transactions/extract-receipt", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    }),
};

// Stats APIs
export const statsAPI = {
  getDashboardData: () => api.get("/api/dashboard/data"),

  overview: () => api.get("/api/stats/overview"),

  monthly: (months = 6) =>
    api.get("/api/stats/monthly", { params: { months } }),

  categories: (type = "expense", months = 1) =>
    api.get("/api/stats/categories", { params: { type, months } }),

  allMonths: () => api.get("/api/stats/all-months"),

  getRecentTransactions: (limit = 5) =>
    api.get("/api/transactions/recent", { params: { limit } }),

  getSavingsGoals: () => api.get("/api/savings-goals"),

  getBudgetCurrent: () => api.get("/api/budget/current"),
};

// Predictions APIs
export const predictionsAPI = {
  comprehensive: () => api.get("/api/predict-spending"),

  simple: (months = 3) =>
    api.get("/api/predict-spending/simple", { params: { months } }),

  weighted: (months = 3) =>
    api.get("/api/predict-spending/weighted", { params: { months } }),

  trend: (months = 6) =>
    api.get("/api/predict-spending/trend", { params: { months } }),

  categories: (months = 3) =>
    api.get("/api/predict-spending/categories", { params: { months } }),

  suggestions: () => api.get("/api/spending-suggestions"),
};

// Savings Goals APIs
export const savingsGoalsAPI = {
  getAll: () => api.get("/api/savings-goals").then((res) => res.data),

  getById: (id: number) =>
    api.get(`/api/savings-goals/${id}`).then((res) => res.data),

  create: (data: any) =>
    api.post("/api/savings-goals", data).then((res) => res.data),

  update: (id: number, data: any) =>
    api.put(`/api/savings-goals/${id}`, data).then((res) => res.data),

  addMoney: (id: number, data: { amount: number; description: string }) =>
    api
      .post(`/api/savings-goals/${id}/add-money`, data)
      .then((res) => res.data),

  delete: (id: number) =>
    api.delete(`/api/savings-goals/${id}`).then((res) => res.data),
};

// Budget APIs
export const budgetAPI = {
  getCurrent: () => api.get("/api/budget/current"),

  set: (budget_limit: number) => api.post("/api/budget/set", { budget_limit }),

  getAlert: () => api.get("/api/budget/alert"),
};

// Categories APIs
export const categoriesAPI = {
  getAll: () => api.get("/api/categories"),
};

// Admin APIs
export const adminAPI = {
  // Implement admin endpoints nếu cần
};

export default api;
