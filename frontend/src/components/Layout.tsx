// Shared Layout Components: Header, Footer, ToastContainer with ODauDay Stay Branding (TypeScript)
import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';
import { ROLES } from '../constants';
import {
    HouseDoorFill,
    Speedometer2,
    Search,
    Globe,
    List,
    PersonCircle,
    BagCheck,
    Building,
    DoorOpen, DoorOpenFill,
    CalendarCheck,
    GraphUpArrow,
    PeopleFill,
    BoxArrowRight,
    BoxArrowInRight,
    ArrowCounterclockwise,
    CheckCircleFill,
    InfoCircleFill,
    ExclamationTriangleFill,
    ExclamationOctagonFill,
    HeartFill,
    HouseDoor,
} from 'react-bootstrap-icons';

// ── Header (ODauDay Stay Brand + Airbnb Experience) ─────────────────────────
export function Header() {
    const { currentUser, logout, switchRole, resetStore, addToast } = useStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const isHome = location.pathname === '/';
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
    const isSearchPage = location.pathname === '/search';

    // Track scroll position to collapse/expand search bar
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Mở modal xác nhận đăng xuất
    const handleOpenLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        setMenuOpen(false);
        setShowLogoutModal(true);
    };

    // Xác nhận đăng xuất thực sự
    const handleConfirmLogout = () => {
        logout();
        setShowLogoutModal(false);
        addToast('Đã đăng xuất tài khoản', 'info');
        navigate('/');
    };

    const handleRoleSwitch = async (role: string) => {
        await switchRole(role);
        setMenuOpen(false);
        addToast(`Đã chuyển sang vai trò: ${role.toUpperCase()}`, 'success');
        if (role === 'admin') {
            navigate('/admin');
        } else if (role === 'host') {
            navigate('/host/properties');
        } else {
            navigate('/client');
        }
    };

    const handleResetData = () => {
        resetStore();
        setMenuOpen(false);
        addToast('Đã khôi phục dữ liệu mẫu ban đầu', 'success');
    };

    return (
        <header className="site-header" style={{ padding: isHome && !isScrolled ? '0.85rem 2.5rem 1rem' : '0.85rem 2.5rem' }}>
            <div className="header-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1760, margin: '0 auto' }}>
                {/* Logo: ODauDay Stay with HouseDoorFill icon (Điều hướng quay về Trang chủ / Danh sách phòng) */}
                <Link
                    to="/"
                    className="brand"
                    aria-label="ODauDay Stay Trang chủ"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'opacity 0.15s ease, transform 0.15s ease',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.opacity = '0.92';
                        e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <HouseDoorFill style={{ fontSize: '1.9rem', color: 'var(--color-primary)' }} />
                    <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.03em' }}>
            ODauDay <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Stay</span>
          </span>
                </Link>

                {!isAuthPage && !((isSearchPage || isHome) && !isScrolled) && (
                    <div>
                        <div
                            className="search-pill-container"
                            onClick={() => navigate('/search')}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && navigate('/search')}
                            aria-label="Tìm kiếm chỗ ở"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                border: '1px solid var(--color-border-strong)',
                                borderRadius: '9999px',
                                boxShadow: 'var(--shadow-search)',
                                padding: '0.45rem 0.65rem 0.45rem 1.25rem',
                                cursor: 'pointer',
                                background: 'var(--color-bg-surface)',
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '0.88rem' }}>
                                <HouseDoor style={{ fontSize: '1rem', color: 'var(--color-primary)' }} />
                                <span>Điểm đến bất kỳ</span>
                            </span>
                            <span className="search-pill-divider" style={{ width: 1, height: 20, background: 'var(--color-border-subtle)', margin: '0 0.85rem' }} />
                            <span style={{ color: 'var(--color-text-primary)', fontSize: '0.88rem', fontWeight: 600 }}>Chọn ngày</span>
                            <span className="search-pill-divider" style={{ width: 1, height: 20, background: 'var(--color-border-subtle)', margin: '0 0.85rem' }} />
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>Số khách</span>
                            <button
                                type="button"
                                style={{
                                    background: 'var(--color-primary)',
                                    color: 'var(--color-text-inverse)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: 34,
                                    height: 34,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: '0.75rem',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                }}
                                aria-label="Tìm kiếm"
                            >
                                <Search style={{ fontSize: '0.85rem' }} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Right Navigation & Profile Menu */}
                <div className="header-actions" ref={menuRef} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                    {currentUser?.role === ROLES.ADMIN ? (
                        <Link
                            to="/admin"
                            className="admin-badge-link"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                color: 'var(--color-text-inverse)',
                                background: 'linear-gradient(135deg, var(--color-secondary-hover) 0%, var(--color-secondary) 100%)',
                                padding: '0.5rem 0.95rem',
                                borderRadius: '9999px',
                                textDecoration: 'none',
                                border: '1px solid var(--color-border-strong)',
                                boxShadow: 'var(--shadow-sm)',
                            }}
                        >
                            <Speedometer2 style={{ color: 'var(--color-primary)' }} />
                            <span>Trang quản trị</span>
                        </Link>
                    ) : (
                        <Link
                            to={currentUser?.role === ROLES.HOST ? '/host/properties' : '/register'}
                            className="host-link"
                            style={{
                                fontWeight: 600,
                                fontSize: '0.88rem',
                                color: 'var(--color-text-primary)',
                                padding: '0.65rem 1rem',
                                borderRadius: '9999px',
                                textDecoration: 'none',
                                transition: 'background 0.2s',
                            }}
                        >
                            {currentUser?.role === ROLES.HOST ? 'Kênh Chủ nhà' : 'Đăng ký'}
                        </Link>
                    )}

                    {/* Wishlist Heart Icon Button */}
                    <Link
                        to="/wishlist"
                        className="icon-btn"
                        title="Danh sách yêu thích"
                        aria-label="Xem danh sách yêu thích"
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            border: 'none',
                            background: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            textDecoration: 'none',
                            color: 'var(--color-primary, #FF385C)',
                            transition: 'background 0.2s, transform 0.15s ease',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = 'var(--color-primary-soft, #FFF1F2)';
                            e.currentTarget.style.transform = 'scale(1.08)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <HeartFill style={{ fontSize: '1.1rem' }} />
                    </Link>

                    {/* User Profile Pill */}
                    <div
                        className="user-menu-pill"
                        onClick={() => setMenuOpen(!menuOpen)}
                        role="button"
                        tabIndex={0}
                        aria-expanded={menuOpen}
                        aria-label="Menu người dùng"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            border: '1px solid var(--color-border-strong)',
                            borderRadius: '9999px',
                            padding: '0.35rem 0.6rem 0.35rem 0.85rem',
                            cursor: 'pointer',
                            background: 'var(--color-bg-surface)',
                            transition: 'box-shadow 0.2s',
                        }}
                    >
                        <List style={{ fontSize: '1.15rem', color: 'var(--color-text-primary)' }} />
                        <div
                            style={{
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                background: 'var(--color-text-muted)',
                                color: 'var(--color-text-inverse)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1rem',
                            }}
                        >
                            <PersonCircle />
                        </div>
                    </div>

                    {/* Dropdown Menu */}
                    {menuOpen && (
                        <div
                            className="user-dropdown"
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: '52px',
                                width: '240px',
                                backgroundColor: 'var(--color-bg-surface)',
                                borderRadius: '12px',
                                boxShadow: 'var(--shadow-dropdown)',
                                border: '1px solid var(--color-border-subtle)',
                                padding: '8px 0',
                                zIndex: 1000,
                            }}
                        >
                            {currentUser ? (
                                <>
                                    <div style={{ padding: '0.75rem 1.25rem 0.5rem', borderBottom: '1px solid var(--line)' }}>
                                        <strong style={{ display: 'block', fontSize: '0.92rem', color: 'var(--ink)' }}>
                                            {currentUser.fullName}
                                        </strong>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)' }}>
                      @{currentUser.username} ·{' '}
                                            <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>
                        {currentUser.role}
                      </span>
                    </span>
                                    </div>

                                    {/* 1. Mục Trang chủ ở vị trí trên cùng của Dropdown Menu (ngay trên "Chuyến đi của tôi") */}
                                    <Link
                                        to="/"
                                        className="dropdown-item bold"
                                        onClick={() => setMenuOpen(false)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none', color: 'var(--color-text-primary)', fontWeight: 600 }}
                                    >
                                        <HouseDoor style={{ fontSize: '1.05rem', color: 'var(--color-primary)' }} /> Trang chủ
                                    </Link>

                                    <Link
                                        to="/my-bookings"
                                        className="dropdown-item"
                                        onClick={() => setMenuOpen(false)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none', color: 'var(--color-text-primary)' }}
                                    >
                                        <BagCheck /> Chuyến đi của tôi
                                    </Link>

                                    <Link
                                        to="/wishlist"
                                        className="dropdown-item"
                                        onClick={() => setMenuOpen(false)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none', color: 'var(--color-text-primary)' }}
                                    >
                                        <HeartFill style={{ color: 'var(--color-primary)' }} /> Danh sách yêu thích
                                    </Link>

                                    {currentUser.role === ROLES.HOST && (
                                        <>
                                            <div className="dropdown-divider" style={{ height: 1, background: 'var(--color-border-subtle)', margin: '4px 0' }} />
                                            <div className="dropdown-section-title" style={{ padding: '4px 16px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Khu vực Chủ nhà</div>
                                            <Link to="/host/properties" className="dropdown-item" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none', color: 'var(--color-text-primary)' }}>
                                                <Building /> Chỗ ở của tôi
                                            </Link>
                                            <Link to="/host/rooms" className="dropdown-item" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none', color: 'var(--color-text-primary)' }}>
                                                <DoorOpen /> Quản lý phòng & Lịch trống
                                            </Link>
                                            <Link to="/host/bookings" className="dropdown-item" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none', color: 'var(--color-text-primary)' }}>
                                                <CalendarCheck /> Quản lý đơn
                                            </Link>
                                            <Link to="/host/revenue" className="dropdown-item" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none', color: 'var(--color-text-primary)' }}>
                                                <GraphUpArrow /> Doanh thu
                                            </Link>
                                        </>
                                    )}

                                    {currentUser.role === ROLES.ADMIN && (
                                        <>
                                            <div className="dropdown-divider" style={{ height: 1, background: 'var(--color-border-subtle)', margin: '4px 0' }} />
                                            <div className="dropdown-section-title" style={{ padding: '4px 16px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Quản trị viên</div>
                                            <Link to="/admin" className="dropdown-item" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none', color: 'var(--color-primary)', fontWeight: 700 }}>
                                                <Speedometer2 /> Bảng điều khiển Quản trị
                                            </Link>
                                            <Link to="/admin/users" className="dropdown-item" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none', color: 'var(--color-text-primary)' }}>
                                                <PeopleFill /> Người dùng & Phân quyền
                                            </Link>
                                            <Link to="/admin/properties" className="dropdown-item" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none', color: 'var(--color-text-primary)' }}>
                                                <Building /> Quản lý chỗ ở toàn sàn
                                            </Link>
                                            <Link to="/admin/bookings" className="dropdown-item" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none', color: 'var(--color-text-primary)' }}>
                                                <CalendarCheck /> Quản lý đơn đặt phòng
                                            </Link>
                                        </>
                                    )}

                                    <div className="dropdown-divider" style={{ height: 1, background: 'var(--color-border-subtle)', margin: '4px 0' }} />

                                    {/* Dev / Tester Quick Role Switcher */}
                                    <div className="dropdown-section-title" style={{ padding: '4px 16px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Chuyển vai trò thử nghiệm</div>
                                    <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem 1rem 0.5rem', flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-outline"
                                            onClick={() => handleRoleSwitch('guest')}
                                        >
                                            Khách
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-outline"
                                            onClick={() => handleRoleSwitch('host')}
                                        >
                                            Chủ nhà
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-outline"
                                            onClick={() => handleRoleSwitch('admin')}
                                        >
                                            Admin
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        className="dropdown-item"
                                        onClick={handleResetData}
                                        style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <ArrowCounterclockwise /> Khôi phục CSDL mẫu
                                    </button>

                                    <div className="dropdown-divider" style={{ height: 1, background: 'var(--color-border-subtle)', margin: '4px 0' }} />
                                    <button
                                        type="button"
                                        className="dropdown-item"
                                        onClick={handleOpenLogout}
                                        style={{ color: 'var(--color-danger)', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 16px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <BoxArrowRight /> Đăng xuất
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/"
                                        className="dropdown-item bold"
                                        onClick={() => setMenuOpen(false)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none', color: 'var(--color-text-primary)', fontWeight: 600 }}
                                    >
                                        <HouseDoor style={{ fontSize: '1.05rem', color: 'var(--color-primary)' }} /> Trang chủ
                                    </Link>
                                    <div className="dropdown-divider" style={{ height: 1, background: 'var(--color-border-subtle)', margin: '4px 0' }} />
                                    <Link
                                        to="/login"
                                        className="dropdown-item bold"
                                        onClick={() => setMenuOpen(false)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none', color: 'var(--color-text-primary)', fontWeight: 700 }}
                                    >
                                        <BoxArrowInRight /> Đăng nhập
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="dropdown-item"
                                        onClick={() => setMenuOpen(false)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none', color: 'var(--color-text-primary)' }}
                                    >
                                        Đăng ký
                                    </Link>
                                    <div className="dropdown-divider" style={{ height: 1, background: 'var(--color-border-subtle)', margin: '4px 0' }} />
                                    <Link
                                        to="/register"
                                        className="dropdown-item"
                                        onClick={() => setMenuOpen(false)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none', color: 'var(--color-text-primary)' }}
                                    >
                                        Cho thuê chỗ ở qua ODauDay
                                    </Link>
                                    <div className="dropdown-divider" style={{ height: 1, background: 'var(--color-border-subtle)', margin: '4px 0' }} />
                                    <div className="dropdown-section-title" style={{ padding: '4px 16px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Đăng nhập nhanh thử nghiệm</div>
                                    <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem 1rem 0.5rem', flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-outline"
                                            onClick={() => handleRoleSwitch('guest')}
                                        >
                                            Khách
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-outline"
                                            onClick={() => handleRoleSwitch('host')}
                                        >
                                            Chủ nhà
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-outline"
                                            onClick={() => handleRoleSwitch('admin')}
                                        >
                                            Admin
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Friendly Luxury Logout Confirmation Modal */}
            {showLogoutModal && (
                <div
                    className="logout-modal-backdrop"
                    onClick={() => setShowLogoutModal(false)}
                >
                    <div
                        className="logout-modal-box"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Soft pulsing avatar */}
                        <div className="logout-avatar-glow">
                            <DoorOpenFill />
                        </div>

                        <h2
                            style={{
                                fontSize: '1.4rem',
                                fontWeight: 800,
                                color: 'var(--color-text-primary)',
                                margin: '0 0 0.5rem',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            Xác nhận đăng xuất
                        </h2>
                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>
                            Bạn có chắc chắn muốn đăng xuất khỏi thiết bị này không?
                        </p>

                        {/* Current User Card */}
                        <div className="logout-user-preview">
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '50%',
                                    background: 'var(--gradient-primary)',
                                    color: 'var(--color-text-inverse)',
                                    fontWeight: 700,
                                    fontSize: '1.1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                {(currentUser?.fullName || currentUser?.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {currentUser?.fullName || currentUser?.username}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                    {currentUser?.role === 'HOST'
                                        ? '🏡 Đối tác Chủ nhà'
                                        : currentUser?.role === 'ADMIN'
                                            ? '🛡️ Quản trị viên'
                                            : '🎒 Khách trải nghiệm'}
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                fontSize: '0.8rem',
                                color: 'var(--color-success)',
                                background: 'var(--color-success-bg)',
                                border: '1px solid var(--color-success-border)',
                                borderRadius: '10px',
                                padding: '0.55rem 0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                justifyContent: 'center',
                            }}
                        >
                            <span>✓ Mọi phòng yêu thích và lịch sử đã được lưu an toàn.</span>
                        </div>

                        {/* Actions */}
                        <div className="logout-actions">
                            <button
                                type="button"
                                className="btn-stay"
                                onClick={() => setShowLogoutModal(false)}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="btn-confirm-logout"
                                onClick={handleConfirmLogout}
                            >
                                <BoxArrowRight /> Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

// ── Footer (ODauDay Stay + Airbnb Clean 4-Column Layout) ────────────────────
export function Footer() {
    return (
        <footer className="site-footer" style={{ borderTop: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-app)', padding: '1.5rem 2.5rem', marginTop: 'auto' }}>
            <div style={{ maxWidth: 1760, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span>© 2026 ODauDay Stay</span>
                    <span>·</span>
                    <Link to="/search" style={{ textDecoration: 'none', color: 'inherit' }}>Tìm chỗ ở</Link>
                    <span>·</span>
                    <Link to="/register" style={{ textDecoration: 'none', color: 'inherit' }}>Đăng ký tài khoản</Link>
                    <span>·</span>
                    <Link to="/host/properties" style={{ textDecoration: 'none', color: 'inherit' }}>Dành cho Chủ nhà</Link>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Globe /> Tiếng Việt (VN)
                    </span>
                    <span>₫ VND</span>
                </div>
            </div>
        </footer>
    );
}

// ── Toast Container ────────────────────────────────────────────────────────
export function ToastContainer() {
    const { toasts, removeToast } = useStore();

    const iconMap: Record<string, ReactNode> = {
        success: <CheckCircleFill className="text-ok" />,
        error: <ExclamationOctagonFill className="text-danger" />,
        warn: <ExclamationTriangleFill className="text-warn" />,
        info: <InfoCircleFill className="text-info" />,
    };

    return (
        <div className="toast-container" aria-live="polite">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast-${t.type}`} role="alert" onClick={() => removeToast(t.id)}>
                    {iconMap[t.type]}
                    <span>{t.message}</span>
                </div>
            ))}
        </div>
    );
}