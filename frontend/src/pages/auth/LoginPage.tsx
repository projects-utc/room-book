// Standardized Luxury Login Page (TypeScript)
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<'guest' | 'host' | 'admin' | ''>('');
  const [loading, setLoading] = useState(false);

  const fillCredentials = (type: 'guest' | 'host' | 'admin', u: string, p: string) => {
    setSelectedDemo(type);
    setUsername(u);
    setPassword(p);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const res = await login(username.trim(), password);
      if (res.success) {
        const displayName = res.user?.fullName || username;
        addToast(`Chào mừng bạn trở lại, ${displayName}! Chúc bạn một ngày tốt lành ✨`, 'success');
        const fromState = (location.state as any)?.from;
        let fromUrl: string | null = null;
        if (typeof fromState === 'string') {
          fromUrl = fromState;
        } else if (fromState && typeof fromState === 'object') {
          const path = fromState.pathname || '';
          const search = fromState.search || '';
          fromUrl = `${path}${search}`;
        }

        const isAuthPage = fromUrl && (
          fromUrl.startsWith('/login') ||
          fromUrl.startsWith('/client/login') ||
          fromUrl.startsWith('/register') ||
          fromUrl.startsWith('/client/register')
        );

        if (res.user?.role === 'HOST') {
          if (fromUrl && fromUrl.startsWith('/host')) {
            navigate(fromUrl, { replace: true });
          } else {
            navigate('/host/bookings', { replace: true });
          }
        } else if (res.user?.role === 'ADMIN') {
          if (fromUrl && fromUrl.startsWith('/admin')) {
            navigate(fromUrl, { replace: true });
          } else {
            navigate('/admin/users', { replace: true });
          }
        } else if (fromUrl && !isAuthPage && !fromUrl.startsWith('/host') && !fromUrl.startsWith('/admin')) {
          navigate(fromUrl, { replace: true });
        } else {
          navigate('/client', { replace: true });
        }
      } else {
        addToast('Không thể đăng nhập. Vui lòng kiểm tra tài khoản, mật khẩu và thử lại.', 'error');
      }
    } catch {
      addToast('Không thể kết nối đến máy chủ. Vui lòng thử lại.', 'error');
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
                  background: 'var(--gradient-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(255, 56, 92, 0.35)',
                }}
              >
                <HouseDoorFill style={{ fontSize: '1.4rem', color: 'var(--color-bg-surface)' }} />
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
                ODauDay <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Stay</span>
              </span>
            </Link>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'var(--color-primary-soft)',
                border: '1px solid var(--color-primary-border)',
                color: 'var(--color-primary)',
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
                color: 'var(--color-text-primary)',
                margin: '0 0 0.4rem',
                letterSpacing: '-0.02em',
              }}
            >
              Chào mừng bạn trở lại! 🌿
            </h1>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
              Cùng ODauDay tiếp tục hành trình khám phá những điểm đến tuyệt vời.
            </p>
          </div>



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
              <label htmlFor="login-password">
                <span>Mật khẩu</span>
              </label>
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
                      borderTopColor: 'var(--color-bg-surface)',
                      borderRadius: '50%',
                    }}
                    className="animate-spin"
                  />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRightShort style={{ fontSize: '1.4rem' }} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Section */}
          <div style={{ margin: '1.75rem 0 1rem', textAlign: 'center' }}>
            <div style={{ height: 1, background: 'var(--color-border-subtle)', width: '100%', marginBottom: '0.65rem' }} />
            <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Tài khoản dùng thử hệ thống
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
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Khách thuê</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>guest.demo</span>
            </div>

            <div
              className={`demo-account-pill ${selectedDemo === 'host' ? 'active' : ''}`}
              onClick={() => fillCredentials('host', 'host.demo', '123')}
              role="button"
              tabIndex={0}
            >
              <span style={{ fontSize: '1.25rem' }}>🏡</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Chủ nhà</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>host.demo</span>
            </div>

            <div
              className={`demo-account-pill ${selectedDemo === 'admin' ? 'active' : ''}`}
              onClick={() => fillCredentials('admin', 'admin', '123')}
              role="button"
              tabIndex={0}
            >
              <span style={{ fontSize: '1.25rem' }}>🛡️</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Quản trị</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>admin</span>
            </div>
          </div>

          {/* Switch to Register */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Bạn chưa có tài khoản?{' '}
            <Link
              to="/register"
              style={{
                color: 'var(--color-primary)',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Đăng ký ngay
            </Link>
          </div>

          {/* Security Assurance Badge */}
          <div className="auth-trust-badge">
            <ShieldCheck style={{ fontSize: '1.05rem', color: 'var(--color-success)' }} />
            <span>Cam kết bảo mật &amp; an toàn thông tin 100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
