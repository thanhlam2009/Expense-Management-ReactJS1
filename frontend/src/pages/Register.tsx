import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState({
    password: '',
    username: '',
    general: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
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

  // Username validation
  useEffect(() => {
    if (formData.username) {
      const validPattern = /^[a-zA-Z0-9_]+$/;
      if (!validPattern.test(formData.username)) {
        setErrors(prev => ({ ...prev, username: 'Chỉ sử dụng chữ cái, số và dấu gạch dưới' }));
      } else {
        setErrors(prev => ({ ...prev, username: '' }));
      }
    }
  }, [formData.username]);

  // Password confirmation validation
  useEffect(() => {
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, password: 'Mật khẩu xác nhận không khớp' }));
    } else {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  }, [formData.password, formData.confirmPassword]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (errors.password || errors.username) {
      return;
    }

    if (formData.password.length < 6) {
      setErrors(prev => ({ ...prev, general: 'Mật khẩu phải có ít nhất 6 ký tự!' }));
      return;
    }

    if (!acceptTerms) {
      setErrors(prev => ({ ...prev, general: 'Vui lòng đồng ý với điều khoản sử dụng!' }));
      return;
    }

    setErrors({ password: '', username: '', general: '' });
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          full_name: formData.fullName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful, redirect to login
        navigate('/login', { state: { message: 'Đăng ký thành công! Vui lòng đăng nhập.' } });
      } else {
        setErrors(prev => ({ ...prev, general: data.error || 'Đăng ký thất bại. Vui lòng thử lại.' }));
      }
    } catch (err: any) {
      setErrors(prev => ({ ...prev, general: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="card">
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <h3 className="fw-bold text-primary">
                <i className="fas fa-user-plus me-2"></i>
                Đăng ký
              </h3>
              <p className="text-muted">Tạo tài khoản mới</p>
            </div>

            {errors.general && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <i className="fas fa-exclamation-circle me-2"></i>
                {errors.general}
                <button type="button" className="btn-close" onClick={() => setErrors(prev => ({ ...prev, general: '' }))}></button>
              </div>
            )}

            <form onSubmit={handleSubmit} id="registerForm">
              <div className="mb-3">
                <label htmlFor="fullName" className="form-label">Họ và tên</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-user"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="fullName" 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên" 
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="username" className="form-label">Tên đăng nhập</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-at"></i>
                  </span>
                  <input 
                    type="text" 
                    className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                    id="username" 
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Nhập tên đăng nhập" 
                    required
                  />
                </div>
                <div className="form-text">Chỉ sử dụng chữ cái, số và dấu gạch dưới</div>
              </div>

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
                    value={formData.email}
                    onChange={handleChange}
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
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Nhập mật khẩu" 
                    required 
                    minLength={6}
                  />
                </div>
                <div className="form-text">Ít nhất 6 ký tự</div>
              </div>

              <div className="mb-3">
                <label htmlFor="confirmPassword" className="form-label">Xác nhận mật khẩu</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-lock"></i>
                  </span>
                  <input 
                    type="password" 
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    id="confirmPassword" 
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Nhập lại mật khẩu" 
                    required
                  />
                </div>
                {errors.password && (
                  <div id="passwordError" className="text-danger">
                    {errors.password}
                  </div>
                )}
              </div>

              <div className="mb-3 form-check">
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  required
                />
                <label className="form-check-label" htmlFor="terms">
                  Tôi đồng ý với <a href="#" className="text-primary">điều khoản sử dụng</a>
                </label>
              </div>

              <button type="submit" className="btn btn-primary w-100 mb-3" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Đang đăng ký...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus me-1"></i>
                    Đăng ký
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <p className="mb-0">
                Đã có tài khoản? 
                <Link to="/login" className="text-primary fw-bold">
                  {' '}Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
