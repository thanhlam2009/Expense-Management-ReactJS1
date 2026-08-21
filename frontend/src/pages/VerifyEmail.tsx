import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();

  const [email, setEmail] = useState((location.state as { email?: string })?.email || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setIsLoading(true);

    try {
      await authAPI.verifyEmail(email, code);
      await checkAuth();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Xác thực thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    setIsResending(true);

    try {
      await authAPI.resendVerification(email);
      setInfo('Đã gửi lại mã xác thực. Vui lòng kiểm tra email.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể gửi lại mã. Vui lòng thử lại.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="auth-card">
              <div className="card">
                <div className="card-body p-5">
                  <div className="text-center mb-4">
                    <i className="fas fa-envelope-open-text fa-3x text-primary mb-3"></i>
                    <h3 className="card-title">Xác thực email</h3>
                    <p className="text-muted">Nhập mã 6 số vừa được gửi tới email của bạn.</p>
                  </div>

                  {error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                      <i className="fas fa-exclamation-circle me-2"></i>
                      {error}
                      <button type="button" className="btn-close" onClick={() => setError('')}></button>
                    </div>
                  )}

                  {info && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                      <i className="fas fa-check-circle me-2"></i>
                      {info}
                      <button type="button" className="btn-close" onClick={() => setInfo('')}></button>
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Email</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="fas fa-envelope"></i>
                        </span>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Nhập email đã đăng ký"
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="code" className="form-label">Mã xác thực</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="fas fa-key"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          id="code"
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Nhập mã 6 số"
                          inputMode="numeric"
                          maxLength={6}
                          required
                        />
                      </div>
                      <div className="form-text">Mã có hiệu lực trong 15 phút</div>
                    </div>

                    <button type="submit" className="btn btn-primary w-100 mb-3" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Đang xác thực...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check me-1"></i>
                          Xác thực
                        </>
                      )}
                    </button>
                  </form>

                  <div className="text-center">
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={handleResend}
                      disabled={isResending || !email}
                    >
                      {isResending ? 'Đang gửi lại...' : 'Gửi lại mã xác thực'}
                    </button>
                  </div>

                  <div className="text-center">
                    <p className="mb-0">
                      <Link to="/login" className="text-primary fw-bold">
                        Quay lại đăng nhập
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
