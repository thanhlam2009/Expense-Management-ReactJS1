import React from "react";
import { Modal, Row, Col } from "react-bootstrap";

interface SpendingSuggestionsModalProps {
  show: boolean;
  onHide: () => void;
  needs: number;
  wants: number;
  savings: number;
  totalIncome: number;
}

const SpendingSuggestionsModal: React.FC<SpendingSuggestionsModalProps> = ({
  show,
  onHide,
  needs,
  wants,
  savings,
  totalIncome,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-lightbulb me-2"></i>Gợi ý phân bổ chi tiêu
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col xs={12} className="mb-3">
            <h6>Gợi ý phân bổ thu nhập theo quy tắc 50/30/20:</h6>
          </Col>
          <Col md={4}>
            <div className="text-center p-3 border rounded">
              <h5 className="text-success">{formatCurrency(needs)}</h5>
              <p className="mb-0">Chi phí thiết yếu (50%)</p>
              <small className="text-muted">Nhà ở, ăn uống, y tế</small>
            </div>
          </Col>
          <Col md={4}>
            <div className="text-center p-3 border rounded">
              <h5 className="text-warning">{formatCurrency(wants)}</h5>
              <p className="mb-0">Chi phí mong muốn (30%)</p>
              <small className="text-muted">Giải trí, mua sắm</small>
            </div>
          </Col>
          <Col md={4}>
            <div className="text-center p-3 border rounded">
              <h5 className="text-info">{formatCurrency(savings)}</h5>
              <p className="mb-0">Tiết kiệm (20%)</p>
              <small className="text-muted">Đầu tư, dự phòng,</small>
            </div>
          </Col>
        </Row>
        <hr />
        <p className="text-muted text-center mb-0">
          <i className="fas fa-info-circle me-1"></i>
          Dựa trên thu nhập tháng này: {formatCurrency(totalIncome)}
        </p>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onHide}>
          Đóng
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default SpendingSuggestionsModal;
