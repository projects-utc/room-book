// Standardized Luxury Register Page (TypeScript)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import {
  HouseDoorFill,
  PersonFill,
  LockFill,
  EyeFill,
  EyeSlashFill,
  TelephoneFill,
  EnvelopeFill,
  ShieldCheck,
  Stars,
  KeyFill,
  ArrowRightShort,
} from 'react-bootstrap-icons';

export default function RegisterPage() {
  const { register, addToast } = useStore();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'GUEST' | 'HOST'>('GUEST');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await register({
        username: username.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        role,
      });

      if (!res.success) {
        setErrorMsg(res.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
        addToast(res.message || 'Đăng ký thất bại', 'error');
      } else {
        addToast('Chúc mừng bạn đã tạo tài khoản thành công! Hãy đăng nhập để bắt đầu trải nghiệm ✨', 'success');
        navigate('/login');
      }
    } catch (err: any) {
      setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-container" style={{ maxWidth: 540 }}>
        <div className="auth-glass-panel">
          {/* Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                textDecoration: 'none',
                marginBottom: '0.65rem',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #FF385C 0%, #E00B41 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(255, 56, 92, 0.35)',
                }}
              >
                <HouseDoorFill style={{ fontSize: '1.35rem', color: '#FFFFFF' }} />
              </div>
              <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FF385C', letterSpacing: '-0.02em' }}>
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
                padding: '0.2rem 0.8rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
              }}
            >
              <Stars style={{ fontSize: '0.85rem' }} /> Thành viên mới ODauDay Stay
            </div>

            <h1
              style={{
                fontSize: '1.55rem',
                fontWeight: 800,
                color: '#0F172A',
                margin: '0 0 0.35rem',
                letterSpacing: '-0.02em',
              }}
            >
              Tạo tài khoản mới ✨
            </h1>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>
              Bắt đầu những kỳ nghỉ trong mơ hoặc đăng tin chia sẻ không gian của bạn
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
              }}
            >
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>⚠️</span>
              <div>
                <strong>Lỗi đăng ký:</strong> {errorMsg}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="auth-input-wrapper">
              <label htmlFor="reg-fullname">
                <span>Họ và tên đầy đủ</span>
              </label>
              <div className="auth-input-container">
                <PersonFill className="auth-input-icon" />
                <input
                  id="reg-fullname"
                  type="text"
                  required
                  className="auth-input-box"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            {/* Username & Password */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="auth-input-wrapper">
                <label htmlFor="reg-username">
                  <span>Tên đăng nhập</span>
                </label>
                <div className="auth-input-container">
                  <PersonFill className="auth-input-icon" />
                  <input
                    id="reg-username"
                    type="text"
                    required
                    className="auth-input-box"
                    placeholder="an.nguyen"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-input-wrapper">
                <label htmlFor="reg-password">
                  <span>Mật khẩu</span>
                </label>
                <div className="auth-input-container">
                  <LockFill className="auth-input-icon" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="auth-input-box"
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
            </div>

            {/* Phone & Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="auth-input-wrapper">
                <label htmlFor="reg-phone">
                  <span>Số điện thoại</span>
                </label>
                <div className="auth-input-container">
                  <TelephoneFill className="auth-input-icon" />
                  <input
                    id="reg-phone"
                    type="tel"
                    required
                    className="auth-input-box"
                    placeholder="0912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-input-wrapper">
                <label htmlFor="reg-email">
                  <span>Email liên hệ</span>
                </label>
                <div className="auth-input-container">
                  <EnvelopeFill className="auth-input-icon" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    className="auth-input-box"
                    placeholder="an@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Role Picker */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.45rem' }}>
                Mục đích sử dụng chính <span style={{ color: '#FF385C' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div
                  onClick={() => setRole('GUEST')}
                  style={{
                    border: role === 'GUEST' ? '2px solid #FF385C' : '1.5px solid #E2E8F0',
                    background: role === 'GUEST' ? '#FFF1F2' : '#FFFFFF',
                    borderRadius: '14px',
                    padding: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: role === 'GUEST' ? '0 4px 12px rgba(255, 56, 92, 0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: '#0F172A', fontSize: '0.92rem' }}>
                    <HouseDoorFill style={{ color: '#FF385C' }} />
                    <span>Khách thuê</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem' }}>
                    Tìm kiếm &amp; đặt phòng nghỉ dưỡng
                  </div>
                </div>

                <div
                  onClick={() => setRole('HOST')}
                  style={{
                    border: role === 'HOST' ? '2px solid #FF385C' : '1.5px solid #E2E8F0',
                    background: role === 'HOST' ? '#FFF1F2' : '#FFFFFF',
                    borderRadius: '14px',
                    padding: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: role === 'HOST' ? '0 4px 12px rgba(255, 56, 92, 0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: '#0F172A', fontSize: '0.92rem' }}>
                    <KeyFill style={{ color: '#FF385C' }} />
                    <span>Chủ nhà</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem' }}>
                    Đăng phòng &amp; đón tiếp du khách
                  </div>
                </div>
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
                  <span>Đang khởi tạo tài khoản...</span>
                </>
              ) : (
                <>
                  <span>Hoàn tất đăng ký</span>
                  <ArrowRightShort style={{ fontSize: '1.4rem' }} />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#64748B' }}>
            Bạn đã có tài khoản rồi?{' '}
            <Link
              to="/login"
              style={{
                color: '#FF385C',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Đăng nhập ngay
            </Link>
          </div>

          {/* Security Badge */}
          <div className="auth-trust-badge">
            <ShieldCheck style={{ fontSize: '1.05rem', color: '#10B981' }} />
            <span>Cam kết bảo mật &amp; không chia sẻ thông tin cá nhân</span>
          </div>
        </div>
      </div>
    </div>
  );
}
