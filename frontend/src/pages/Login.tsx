import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Card animation on mount
  useEffect(() => {
    const card = document.querySelector('.auth-card .card') as HTMLElement;
    if (card) {
      card.style.transform = 'translateY(20px)';
      card.style.opacity = '0';
      
      setTimeout(() => {
        card.style.transition = 'all 0.5s ease';
        card.style.transform = 'translateY(0)';
        card.style.opacity = '1';
      }, 100);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUnverifiedEmail('');
    setIsLoading(true);

    try {
      await login(email, password, rememberMe);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      if (err.response?.status === 403 && err.response?.data?.email) {
        setUnverifiedEmail(err.response.data.email);
      }
    } finally {
      setIsLoading(false);
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
                    <i className="fas fa-wallet fa-3x text-primary mb-3"></i>
                    <h3 className="card-title">Đăng nhập</h3>
                    <p className="text-muted">Chào mừng bạn quay trở lại!</p>
                  </div>

                  {error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                      <i className="fas fa-exclamation-circle me-2"></i>
                      {error}
                      {unverifiedEmail && (
                        <>
                          {' '}
                          <Link to="/verify-email" state={{ email: unverifiedEmail }} className="alert-link">
                            Xác thực email ngay
                          </Link>
                        </>
                      )}
                      <button type="button" className="btn-close" onClick={() => setError('')}></button>
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
                          name="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Nhập email của bạn"
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">Mật khẩu</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="fas fa-lock"></i>
                        </span>
                        <input 
                          type="password" 
                          className="form-control" 
                          id="password" 
                          name="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Nhập mật khẩu"
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3 form-check">
                      <input 
                        type="checkbox" 
                        className="form-check-input" 
                        id="remember"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="remember">
                        Ghi nhớ đăng nhập
                      </label>
                    </div>

                    <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Đang đăng nhập...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-sign-in-alt me-1"></i>
                          Đăng nhập
                        </>
                      )}
                    </button>
                  </form>

                  <div className="text-center">
                    <p className="mb-0">
                      Chưa có tài khoản? 
                      <Link to="/register" className="text-primary fw-bold">
                        {' '}Đăng ký ngay
                      </Link>
                    </p>
                  </div>

                  {/* Demo accounts info */}
                  <hr className="my-4" />
                  <div className="text-center">
                    <small className="text-muted">
                      <strong>Demo:</strong><br />
                      Admin: admin@example.com / admin123<br />
                      User: user@example.com / user123
                    </small>
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

export default Login;
