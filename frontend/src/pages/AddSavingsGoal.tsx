import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { savingsGoalsAPI } from "../services/api";

type GoalType =
  | ""
  | "vehicle"
  | "travel"
  | "education"
  | "electronics"
  | "emergency"
  | "other";

export default function AddSavingsGoal() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    goal_type: "" as GoalType,
    target_amount: "",
    target_date: "",
    description: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await savingsGoalsAPI.create({
        name: formData.name,
        goal_type: formData.goal_type,
        target_amount: parseFloat(formData.target_amount),
        target_date: formData.target_date || undefined,
        description: formData.description || undefined,
      });

      navigate("/savings-goals");
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi tạo mục tiêu");
    } finally {
      setSubmitting(false);
    }
  };

  const setGoal = (name: string, amount: number, type: GoalType) => {
    setFormData((prev) => ({
      ...prev,
      name,
      goal_type: type,
      target_amount: amount.toString(),
    }));
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        {/* FORM CARD */}
        <div className="card">
          <div className="card-header">
            <h4 className="mb-0">
              <i className="fas fa-target me-2"></i>
              Thêm mục tiêu tiết kiệm
            </h4>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Tên mục tiêu */}
              <div className="mb-3">
                <label className="form-label">Tên mục tiêu *</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ví dụ: Mua xe máy, Du lịch..."
                  required
                />
              </div>

              {/* Loại mục tiêu */}
              <div className="mb-3">
                <label className="form-label">Loại mục tiêu *</label>
                <select
                  className="form-select"
                  name="goal_type"
                  value={formData.goal_type}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Chọn loại mục tiêu --</option>
                  <option value="vehicle">Quỹ mua xe máy</option>
                  <option value="travel">Quỹ đi du lịch</option>
                  <option value="education">Quỹ học tập</option>
                  <option value="electronics">Quỹ mua đồ công nghệ</option>
                  <option value="emergency">Quỹ dự phòng</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              {/* Số tiền */}
              <div className="mb-3">
                <label className="form-label">Số tiền mục tiêu *</label>
                <input
                  type="number"
                  className="form-control"
                  name="target_amount"
                  value={formData.target_amount}
                  onChange={handleChange}
                  min="100000"
                  step="100000"
                  required
                />
              </div>

              {/* Ngày mục tiêu */}
              <div className="mb-3">
                <label className="form-label">Ngày mục tiêu</label>
                <input
                  type="date"
                  className="form-control"
                  name="target_date"
                  value={formData.target_date}
                  onChange={handleChange}
                  min={today}
                />
                <div className="form-text">Không bắt buộc</div>
              </div>

              {/* Mô tả */}
              <div className="mb-3">
                <label className="form-label">Mô tả</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              {/* Buttons */}
              <div className="row">
                <div className="col-6">
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={submitting}
                  >
                    {submitting ? "Đang tạo..." : "Tạo mục tiêu"}
                  </button>
                </div>
                <div className="col-6">
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100"
                    onClick={() => navigate("/savings-goals")}
                  >
                    Quay lại
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* QUICK SUGGESTIONS */}
        <div className="card mt-4">
          <div className="card-header">
            <h6 className="mb-0">
              <i className="fas fa-lightbulb me-2"></i>
              Gợi ý mục tiêu phổ biến
            </h6>
          </div>
          <div className="card-body">
            <div className="row g-2">
              <div className="col-6">
                <button
                  className="btn btn-outline-primary w-100"
                  type="button"
                  onClick={() => setGoal("Xe máy mới", 50000000, "vehicle")}
                >
                  Xe máy mới
                  <br />
                  <small>50 triệu</small>
                </button>
              </div>
              <div className="col-6">
                <button
                  className="btn btn-outline-primary w-100"
                  type="button"
                  onClick={() => setGoal("Du lịch", 10000000, "travel")}
                >
                  Du lịch
                  <br />
                  <small>10 triệu</small>
                </button>
              </div>
              <div className="col-6">
                <button
                  className="btn btn-outline-primary w-100"
                  type="button"
                  onClick={() => setGoal("Laptop mới", 20000000, "electronics")}
                >
                  Laptop mới
                  <br />
                  <small>20 triệu</small>
                </button>
              </div>
              <div className="col-6">
                <button
                  className="btn btn-outline-primary w-100"
                  type="button"
                  onClick={() => setGoal("Quỹ khẩn cấp", 30000000, "emergency")}
                >
                  Dự phòng
                  <br />
                  <small>30 triệu</small>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
