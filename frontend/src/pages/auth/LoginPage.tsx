// Standardized Luxury Login Page (TypeScript)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import {
  HouseDoorFill,
  PersonFill,
  LockFill,
  EyeFill,
  EyeSlashFill,
  ShieldCheck,
  Stars,
  ArrowRightShort,
} from 'react-bootstrap-icons';

export default function LoginPage() {
  const { login, addToast } = useStore();
  const navigate = useNavigate();

  const [username, setUsername] = useState('guest.demo');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<'guest' | 'host' | 'admin'>('guest');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fillCredentials = (type: 'guest' | 'host' | 'admin', u: string, p: string) => {
    setSelectedDemo(type);
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await login(username.trim(), password);
      if (!res.success) {
        setErrorMsg(res.message || 'Tài khoản hoặc mật khẩu không chính xác. Bạn vui lòng thử lại nhé!');
        addToast(res.message || 'Đăng nhập không thành công', 'error');
      } else {
        const displayName = res.user?.fullName || username;
        addToast(`Chào mừng bạn trở lại, ${displayName}! Chúc bạn một ngày tốt lành ✨`, 'success');
        if (res.user?.role === 'HOST') {
          navigate('/host/properties');
        } else if (res.user?.role === 'ADMIN') {
          navigate('/admin/users');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-container">
        <div className="auth-glass-panel">
          {/* Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                textDecoration: 'none',
                marginBottom: '0.85rem',
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #FF385C 0%, #E00B41 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(255, 56, 92, 0.35)',
                }}
              >
                <HouseDoorFill style={{ fontSize: '1.4rem', color: '#FFFFFF' }} />
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FF385C', letterSpacing: '-0.02em' }}>
                ODauDay <span style={{ fontWeight: 600, color: '#1E293B' }}>Stay</span>
              </span>
            </Link>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#FFF1F2',
                border: '1px solid #FFE4E6',
                color: '#E11D48',
                borderRadius: '9999px',
                padding: '0.25rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: '0.65rem',
              }}
            >
              <Stars style={{ fontSize: '0.85rem' }} /> Trải nghiệm nghỉ dưỡng đẳng cấp
            </div>

            <h1
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: '#0F172A',
                margin: '0 0 0.4rem',
                letterSpacing: '-0.02em',
              }}
            >
              Chào mừng bạn trở lại! 🌿
            </h1>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.92rem', lineHeight: 1.5 }}>
              Cùng ODauDay tiếp tục hành trình khám phá những điểm đến tuyệt vời.
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                color: '#991B1B',
                fontSize: '0.88rem',
                lineHeight: 1.45,
              }}
            >
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>⚠️</span>
              <div>
                <strong>Lỗi đăng nhập:</strong> {errorMsg}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Username Input */}
            <div className="auth-input-wrapper">
              <label htmlFor="login-username">
                <span>Tên đăng nhập</span>
              </label>
              <div className="auth-input-container">
                <PersonFill className="auth-input-icon" />
                <input
                  id="login-username"
                  type="text"
                  required
                  className="auth-input-box"
                  placeholder="Nhập tên đăng nhập của bạn"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setSelectedDemo('' as any);
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="auth-input-wrapper">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label htmlFor="login-password" style={{ margin: 0 }}>
                  <span>Mật khẩu</span>
                </label>
                <span style={{ fontSize: '0.8rem', color: '#FF385C', fontWeight: 600, cursor: 'pointer' }}>
                  Quên mật khẩu?
                </span>
              </div>
              <div className="auth-input-container">
                <LockFill className="auth-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="auth-input-box"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setSelectedDemo('' as any);
                  }}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeSlashFill /> : <EyeFill />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn"
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#FFFFFF',
                      borderRadius: '50%',
                    }}
                    className="animate-spin"
                  />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập ngay</span>
                  <ArrowRightShort style={{ fontSize: '1.4rem' }} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Section */}
          <div style={{ margin: '1.75rem 0 1.25rem', textAlign: 'center', position: 'relative' }}>
            <div style={{ height: 1, background: '#E2E8F0', width: '100%' }} />
            <span
              style={{
                position: 'absolute',
                top: -11,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#FFFFFF',
                padding: '0 0.85rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#64748B',
                whiteSpace: 'nowrap',
              }}
            >
              ĐĂNG NHẬP NHANH THỬ NGHIỆM
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
            <div
              className={`demo-account-pill ${selectedDemo === 'guest' ? 'active' : ''}`}
              onClick={() => fillCredentials('guest', 'guest.demo', '123')}
              role="button"
              tabIndex={0}
            >
              <span style={{ fontSize: '1.25rem' }}>🎒</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>Khách thuê</span>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>guest.demo</span>
            </div>

            <div
              className={`demo-account-pill ${selectedDemo === 'host' ? 'active' : ''}`}
              onClick={() => fillCredentials('host', 'host.demo', '123')}
              role="button"
              tabIndex={0}
            >
              <span style={{ fontSize: '1.25rem' }}>🏡</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>Chủ nhà</span>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>host.demo</span>
            </div>

            <div
              className={`demo-account-pill ${selectedDemo === 'admin' ? 'active' : ''}`}
              onClick={() => fillCredentials('admin', 'admin', '123')}
              role="button"
              tabIndex={0}
            >
              <span style={{ fontSize: '1.25rem' }}>🛡️</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>Quản trị</span>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>admin</span>
            </div>
          </div>

          {/* Switch to Register */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#64748B' }}>
            Bạn chưa có tài khoản?{' '}
            <Link
              to="/register"
              style={{
                color: '#FF385C',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Đăng ký miễn phí ngay
            </Link>
          </div>

          {/* Security Assurance Badge */}
          <div className="auth-trust-badge">
            <ShieldCheck style={{ fontSize: '1.05rem', color: '#10B981' }} />
            <span>Bảo vệ quyền riêng tư &amp; an toàn dữ liệu 100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
