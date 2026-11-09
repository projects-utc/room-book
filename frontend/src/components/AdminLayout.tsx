import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';
import {
  Speedometer2,
  PeopleFill,
  Building,
  CalendarCheck,
  TicketPerforatedFill,
  JournalText,
  HouseDoorFill,
  BoxArrowRight,
  Globe,
  ShieldCheck,
  List,
} from 'react-bootstrap-icons';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { currentUser, logout, addToast } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navItems = [
    {
      group: 'BÁO CÁO & TỔNG QUAN',
      items: [
        { path: '/admin', label: 'Tổng quan hệ thống', icon: <Speedometer2 /> },
      ],
    },
    {
      group: 'QUẢN LÝ NGHIỆP VỤ',
      items: [
        { path: '/admin/users', label: 'Người dùng & Phân quyền', icon: <PeopleFill /> },
        { path: '/admin/properties', label: 'Chỗ ở & Homestay', icon: <Building /> },
        { path: '/admin/bookings', label: 'Đơn đặt phòng toàn sàn', icon: <CalendarCheck /> },
        { path: '/admin/promotions', label: 'Mã giảm giá & Voucher', icon: <TicketPerforatedFill /> },
      ],
    },
    {
      group: 'GIÁM SÁT & BẢO MẬT',
      items: [
        { path: '/admin/audit-logs', label: 'Nhật ký hoạt động', icon: <JournalText /> },
      ],
    },
  ];

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    addToast('Đã đăng xuất khỏi tài khoản Quản trị viên.', 'info');
    navigate('/login');
  };

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currentUser.role !== 'ADMIN') {
    return <Navigate to={currentUser.role === 'HOST' ? '/host/properties' : '/client'} replace />;
  }

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-root" style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 1040 }}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{
          width: 270,
          background: '#0F172A',
          color: '#E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 1050,
          boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
          flexShrink: 0,
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Brand Header */}
        <div style={{ padding: '1.5rem 1.4rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #FF385C 0%, #E00B41 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
                fontSize: '1.25rem',
                boxShadow: '0 4px 12px rgba(255, 56, 92, 0.4)',
              }}
            >
              <HouseDoorFill />
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                ODauDay <span style={{ color: '#FF385C' }}>Admin</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Hệ thống Quản trị sàn
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Groups */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 0.85rem' }}>
          {navItems.map((group, gIdx) => (
            <div key={gIdx} style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#64748B',
                  letterSpacing: '0.08em',
                  padding: '0 0.75rem 0.45rem',
                  textTransform: 'uppercase',
                }}
              >
                {group.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {group.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 10,
                        textDecoration: 'none',
                        fontSize: '0.88rem',
                        fontWeight: active ? 700 : 500,
                        color: active ? '#FFFFFF' : '#94A3B8',
                        background: active
                          ? 'linear-gradient(90deg, rgba(255, 56, 92, 0.22) 0%, rgba(255, 56, 92, 0.08) 100%)'
                          : 'transparent',
                        borderLeft: active ? '3.5px solid #FF385C' : '3.5px solid transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '1.1rem', color: active ? '#FF385C' : '#64748B' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Client Portal Quick Link */}
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.18)' }}>
          <Link
            to="/client"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.65rem 0.85rem',
              borderRadius: 10,
              background: '#1E293B',
              color: '#38BDF8',
              textDecoration: 'none',
              fontSize: '0.84rem',
              fontWeight: 600,
              border: '1px solid rgba(56, 189, 248, 0.2)',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe style={{ fontSize: '1rem' }} />
              <span>Xem trang Khách</span>
            </span>
            <span style={{ fontSize: '0.72rem', background: '#0284C7', color: '#FFF', padding: '0.15rem 0.45rem', borderRadius: 6, fontWeight: 700 }}>
              /client
            </span>
          </Link>
        </div>

        {/* Current User Bar */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF385C 0%, #D70466 100%)',
                color: '#FFF',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {(currentUser?.fullName || currentUser?.username || 'A').charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, lineHeight: 1.25 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.fullName || 'Quản trị viên'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldCheck /> Super Admin
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: 6,
              fontSize: '1.15rem',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Đăng xuất"
          >
            <BoxArrowRight />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Admin Top Header */}
        <header
          style={{
            height: 64,
            background: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.75rem',
            position: 'sticky',
            top: 0,
            zIndex: 1020,
          }}
        >
          {/* Left: Mobile Toggle & Page Title indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              className="admin-mobile-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'transparent',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                padding: '0.35rem 0.55rem',
                cursor: 'pointer',
                display: 'none',
              }}
            >
              <List style={{ fontSize: '1.25rem' }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
              <span style={{ color: '#64748B' }}>Admin Portal</span>
              <span style={{ color: '#CBD5E1' }}>/</span>
              <span style={{ color: '#0F172A', fontWeight: 700 }}>
                {location.pathname === '/admin' || location.pathname === '/admin/dashboard'
                  ? 'Tổng quan hệ thống'
                  : location.pathname.includes('/users')
                  ? 'Người dùng & Phân quyền'
                  : location.pathname.includes('/properties')
                  ? 'Chỗ ở & Cơ sở lưu trú'
                  : location.pathname.includes('/bookings')
                  ? 'Đơn đặt phòng toàn sàn'
                  : location.pathname.includes('/promotions')
                  ? 'Mã giảm giá & Voucher'
                  : location.pathname.includes('/audit-logs')
                  ? 'Nhật ký hoạt động'
                  : 'Quản trị'}
              </span>
            </div>
          </div>

          {/* Right: Quick actions & Status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Server Online Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                borderRadius: '9999px',
                padding: '0.25rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <span>Hệ thống: Trực tuyến</span>
            </div>

            {/* Switch to Client Button */}
            <Link
              to="/client"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#F1F5F9',
                color: '#334155',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                padding: '0.4rem 0.85rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Globe style={{ color: '#FF385C' }} />
              <span>Giao diện Khách (/client)</span>
            </Link>

            {/* Admin Avatar Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF385C 0%, #E00B41 100%)',
                  color: '#FFF',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {(currentUser?.fullName || 'A').charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>
                {currentUser?.username || 'admin'}
              </span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main style={{ flex: 1, padding: '1.75rem 2rem 3rem', maxWidth: 1600, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {children}
        </main>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="logout-modal-backdrop" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="logout-avatar-glow">
              <BoxArrowRight />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem' }}>
              Đăng xuất Quản trị viên?
            </h2>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn rời khỏi phiên làm việc Quản trị viên không?
            </p>
            <div className="logout-actions">
              <button type="button" className="btn-stay" onClick={() => setShowLogoutModal(false)}>
                Ở lại
              </button>
              <button type="button" className="btn-confirm-logout" onClick={handleConfirmLogout}>
                <BoxArrowRight /> Đăng xuất an toàn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLayout;

