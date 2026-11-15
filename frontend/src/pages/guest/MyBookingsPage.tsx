// Standardized "Trips" (Chuyến đi của tôi) Page (Airbnb Luxury Style)
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { formatVND } from '../../constants';
import { Button, Badge } from '../../components';
import { stayApi } from '../../api/stayApi';
import { Booking } from '../../data';
import {
  HouseDoor,
  Search,
  PencilSquare,
  GeoAltFill,
  CalendarCheck,
  PeopleFill,
  ClockHistory,
  CheckCircleFill,
  XCircleFill,
  ArrowRight,
  ArrowRepeat,
  XCircle,
} from 'react-bootstrap-icons';

export default function MyBookingsPage() {
  const { store, currentUser, addToast } = useStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const username = currentUser?.username || 'guest.demo';

  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'ALL'>(() => {
    const tabParam = searchParams.get('tab')?.toUpperCase();
    if (tabParam === 'UPCOMING' || tabParam === 'ACTIVE' || tabParam === 'DETAIL') return 'UPCOMING';
    if (!tabParam || tabParam === 'COMPLETED' || tabParam === 'HISTORY') return 'COMPLETED';
    if (tabParam === 'CANCELLED') return 'CANCELLED';
    return 'ALL';
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    const tabParam = searchParams.get('tab')?.toUpperCase();
    if (tabParam === 'COMPLETED' || tabParam === 'HISTORY') {
      setActiveTab('COMPLETED');
    } else if (tabParam === 'UPCOMING' || tabParam === 'ACTIVE' || tabParam === 'DETAIL') {
      setActiveTab('UPCOMING');
    } else if (tabParam === 'CANCELLED') {
      setActiveTab('CANCELLED');
    } else if (tabParam === 'ALL') {
      setActiveTab('ALL');
    } else if (!tabParam) {
      setActiveTab('COMPLETED');
    }
  }, [searchParams]);

  useEffect(() => setCurrentPage(1), [activeTab]);

  const handleTabChange = (tab: 'COMPLETED' | 'CANCELLED' | 'ALL') => {
    setActiveTab(tab);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  // Tập hợp các mã đơn đã có đánh giá (từ local store + API)
  const [reviewedCodes, setReviewedCodes] = useState<Set<string>>(() => {
    const set = new Set<string>();
    store.getAllReviews().forEach(r => {
      if (r.bookingCode) set.add(r.bookingCode);
    });
    return set;
  });

  const normalizeBookingList = (list: Booking[], extraReviewedCodes?: Set<string>): Booking[] => {
    return list.map(b => {
      const isRev = Boolean(
        b.isReviewed === true ||
        (b as any).is_reviewed === true ||
        (b as any).is_reviewed === 1 ||
        store.isBookingReviewed(b.code) ||
        (extraReviewedCodes && extraReviewedCodes.has(b.code)) ||
        reviewedCodes.has(b.code)
      );
      return {
        ...b,
        isReviewed: isRev,
        is_reviewed: isRev,
      };
    });
  };

  const [myBookings, setMyBookings] = useState<Booking[]>(() => {
    return normalizeBookingList(store.getMyBookings(username));
  });

  useEffect(() => {
    // 1. Tải danh sách đánh giá từ backend để đồng bộ chính xác các đơn đã đánh giá
    stayApi.getReviews().then(res => {
      if (res.success && Array.isArray(res.data)) {
        const set = new Set<string>(reviewedCodes);
        res.data.forEach(r => {
          if (r.bookingCode) set.add(r.bookingCode);
        });
        setReviewedCodes(set);
        setMyBookings(prev => normalizeBookingList(prev, set));
      }
    }).catch(() => { });

    // 2. Tải danh sách đơn đặt phòng của người dùng
    if (username) {
      stayApi.getBookings(username).then(res => {
        if (res.success && Array.isArray(res.data)) {
          setMyBookings(normalizeBookingList(res.data));
        }
      }).catch(() => { });
    }
  }, [username]);

  // Filter bookings by tab, then show the latest orders first.
  const filteredBookings = myBookings.filter(b => {
    if (activeTab === 'UPCOMING') return ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(b.status);
    if (activeTab === 'COMPLETED') return b.status === 'COMPLETED';
    if (activeTab === 'CANCELLED') return ['CANCELLED', 'REJECTED'].includes(b.status);
    return true;
  }).sort((a, b) => {
    const dateOrder = Date.parse(b.createdAt || '') - Date.parse(a.createdAt || '');
    return Number.isNaN(dateOrder) || dateOrder === 0
      ? b.code.localeCompare(a.code, undefined, { numeric: true })
      : dateOrder;
  });
  const pageCount = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const visibleBookings = filteredBookings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

  const handleCancelBooking = (code: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy đơn đặt phòng #${code}?`)) {
      const res = store.cancelBooking(code);
      stayApi.cancelBooking(code).catch(() => { });
      if (res.success) {
        addToast(`Đã hủy thành công đơn #${code}`, 'success');
        setMyBookings(prev => prev.map(b => b.code === code ? { ...b, status: 'CANCELLED' } : b));
      } else {
        addToast(res.message || 'Không thể hủy đơn', 'error');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 12px',
            borderRadius: 999,
            background: 'var(--color-warning-bg)',
            color: 'var(--color-warning)',
            border: '1px solid var(--color-warning-border)',
            fontSize: '0.78rem',
            fontWeight: 700
          }}>
            <ClockHistory style={{ fontSize: '0.82rem' }} /> Chờ chủ nhà duyệt
          </span>
        );
      case 'CONFIRMED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 12px',
            borderRadius: 999,
            background: 'var(--color-info-bg)',
            color: 'var(--color-info)',
            border: '1px solid var(--color-info-border)',
            fontSize: '0.78rem',
            fontWeight: 700
          }}>
            <CheckCircleFill style={{ fontSize: '0.82rem' }} /> Đã xác nhận đặt chỗ
          </span>
        );
      case 'CHECKED_IN':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 12px',
            borderRadius: 999,
            background: 'var(--color-success-bg)',
            color: 'var(--color-success)',
            border: '1px solid var(--color-success-border)',
            fontSize: '0.78rem',
            fontWeight: 700
          }}>
            <HouseDoor style={{ fontSize: '0.82rem' }} /> Đang lưu trú
          </span>
        );
      case 'COMPLETED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 12px',
            borderRadius: 999,
            background: 'var(--color-bg-muted)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border-strong)',
            fontSize: '0.78rem',
            fontWeight: 700
          }}>
            ✓ Đã hoàn thành
          </span>
        );
      case 'CANCELLED':
      case 'REJECTED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 12px',
            borderRadius: 999,
            background: 'var(--color-danger-bg)',
            color: 'var(--color-danger)',
            border: '1px solid var(--color-danger-border)',
            fontSize: '0.78rem',
            fontWeight: 700
          }}>
            <XCircleFill style={{ fontSize: '0.82rem' }} /> Đã hủy
          </span>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const completedCount = myBookings.filter(b => b.status === 'COMPLETED').length;
  const cancelledCount = myBookings.filter(b => ['CANCELLED', 'REJECTED'].includes(b.status)).length;

  return (
    <div style={{ maxWidth: 1760, margin: '2rem auto 5rem', padding: '0 clamp(1rem, 2.5vw, 2.5rem)' }}>
      {/* ── Top Header Section ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary-soft) 0%, var(--color-bg-surface) 60%, var(--color-bg-app) 100%)',
        borderRadius: 24,
        padding: '2.25rem 2.5rem',
        border: '1px solid var(--color-primary-border)',
        boxShadow: '0 4px 20px rgba(225, 29, 72, 0.04)',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'var(--color-primary-soft)', color: 'var(--color-primary)', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
            <span>{activeTab === 'UPCOMING' ? 'Chi tiết đặt phòng' : 'Lịch sử đặt phòng'}</span>
          </div>
          <h1 style={{ fontSize: '2.15rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
            {activeTab === 'UPCOMING'
              ? 'Chi tiết đặt phòng'
              : activeTab === 'COMPLETED'
              ? 'Lịch sử đặt phòng'
              : activeTab === 'CANCELLED'
              ? 'Đơn đặt phòng đã hủy'
              : 'Tất cả đơn đặt phòng'}
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.98rem' }}>
            {activeTab === 'UPCOMING'
              ? <>Các đơn đang chờ duyệt, đã xác nhận hoặc đang lưu trú của tài khoản <strong>{currentUser?.fullName || username}</strong>.</>
              : activeTab === 'COMPLETED'
              ? <>Hiển thị các đơn đặt phòng <strong>đã hoàn thành</strong> kỳ lưu trú của tài khoản <strong>{currentUser?.fullName || username}</strong>.</>
              : activeTab === 'CANCELLED'
                ? <>Hiển thị các đơn đã hủy của tài khoản <strong>{currentUser?.fullName || username}</strong>.</>
                : <>Toàn bộ đơn đặt phòng của tài khoản <strong>{currentUser?.fullName || username}</strong>.</>}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            background: 'var(--gradient-primary)',
            color: 'var(--color-bg-surface)',
            border: 'none',
            borderRadius: 14,
            padding: '0.85rem 1.6rem',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(225, 29, 72, 0.28)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Search /> Khám phá chỗ ở mới
        </button>
      </div>

      {/* ── Summary Stat Pills Bar ── */}
      {activeTab !== 'UPCOMING' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div
          onClick={() => handleTabChange('COMPLETED')}
          style={{
            background: activeTab === 'COMPLETED' ? 'var(--color-success-bg)' : 'var(--color-bg-surface)',
            border: activeTab === 'COMPLETED' ? '2px solid var(--color-success)' : '1px solid var(--color-border-subtle)',
            borderRadius: 16,
            padding: '1.15rem 1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'COMPLETED' ? '0 4px 16px rgba(22, 163, 74, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
            <CheckCircleFill />
          </div>
          <div>
            <strong style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)', display: 'block' }}>Lịch sử đặt phòng</strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', fontWeight: 600 }}>Đã hoàn thành ({completedCount})</span>
          </div>
        </div>

        <div
          onClick={() => handleTabChange('CANCELLED')}
          style={{
            background: activeTab === 'CANCELLED' ? 'var(--color-danger-bg)' : 'var(--color-bg-surface)',
            border: activeTab === 'CANCELLED' ? '2px solid var(--color-danger)' : '1px solid var(--color-border-subtle)',
            borderRadius: 16,
            padding: '1.15rem 1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'CANCELLED' ? '0 4px 16px rgba(220, 38, 38, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-danger-bg)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
            <XCircleFill />
          </div>
          <div>
            <strong style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)', display: 'block' }}>Đơn đã hủy</strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', fontWeight: 600 }}>Đã hủy ({cancelledCount})</span>
          </div>
        </div>

        <div
          onClick={() => handleTabChange('ALL')}
          style={{
            background: activeTab === 'ALL' ? 'var(--color-bg-app)' : 'var(--color-bg-surface)',
            border: activeTab === 'ALL' ? '2px solid var(--color-text-primary)' : '1px solid var(--color-border-subtle)',
            borderRadius: 16,
            padding: '1.15rem 1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'ALL' ? '0 4px 16px rgba(15, 23, 42, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-bg-muted)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
            <HouseDoor />
          </div>
          <div>
            <strong style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)', display: 'block' }}>Tất cả đơn đặt</strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', fontWeight: 600 }}>Toàn bộ ({myBookings.length})</span>
          </div>
        </div>
      </div>}

      {/* ── Trips Cards List ── */}
      {filteredBookings.length === 0 ? (
        <div style={{
          background: 'var(--color-bg-surface)',
          borderRadius: 24,
          padding: '4.5rem 2rem',
          textAlign: 'center',
          border: '1px dashed var(--color-border-strong)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2.5rem' }}>
            <HouseDoor />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--color-text-primary)' }}>
            {activeTab === 'UPCOMING' ? 'Không có đơn đặt phòng chưa hoàn thành' : activeTab === 'COMPLETED' ? 'Chưa có đơn đặt phòng nào trong lịch sử' : activeTab === 'CANCELLED' ? 'Chưa có đơn đặt phòng nào đã hủy' : 'Chưa tìm thấy chuyến đi nào'}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 440, margin: '0 auto 1.75rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
            {activeTab === 'UPCOMING'
              ? 'Đơn mới đặt, đã xác nhận và đang lưu trú sẽ hiển thị tại đây.'
              : activeTab === 'COMPLETED'
              ? 'Các đơn đặt phòng sau khi quý khách trả phòng và hoàn tất lưu trú sẽ được lưu trữ tự động tại mục Lịch sử đặt phòng.'
                : 'Đã đến lúc chuẩn bị hành lý và lên kế hoạch cho kỳ nghỉ dưỡng mơ ước cùng ODauDay Stay!'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              background: 'var(--gradient-primary)',
              color: 'var(--color-bg-surface)',
              border: 'none',
              borderRadius: 12,
              padding: '0.8rem 1.8rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)'
            }}
          >
            Bắt đầu khám phá phòng nghỉ
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {visibleBookings.map(b => {
            // Find property object to fetch real image & details
            const property = store.getProperty(b.propertyId) || store.getAllProperties().find(p => p.name === b.propertyName) || store.getProperty(1);
            const propertyImg = property?.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
            const city = property?.city || 'Hà Nội';

            return (
              <div
                key={b.code}
                className="my-trip-card"
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 20,
                  overflow: 'hidden',
                  boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                  alignItems: 'stretch',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 28px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                }}
              >
                {/* ── Left: Property Photo ── */}
                <div
                  className="my-trip-photo"
                  style={{
                    cursor: b.status === 'COMPLETED' ? 'default' : 'pointer',
                  }}
                  onClick={b.status === 'COMPLETED' ? undefined : () => navigate(`/my-bookings/${b.code}`)}
                >
                  <img
                    className="my-trip-photo-image"
                    src={propertyImg}
                    alt={b.propertyName}
                  />

                  {/* Top-left stay code */}
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: 'var(--color-bg-surface)',
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: '0.74rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                  }}>
                    #{b.code}
                  </div>

                  {/* Bottom-left nights counter */}
                  <div style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 12,
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(4px)',
                    color: 'var(--color-text-primary)',
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                  }}>
                    {b.nights} ĐÊM LƯU TRÚ
                  </div>
                </div>

                {/* ── Middle: Info Details ── */}
                <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.85rem' }}>
                  <div>
                    {/* Status Pill & Date created */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                      {getStatusBadge(b.status)}
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        Đặt ngày {b.createdAt || 'Gần đây'}
                      </span>
                    </div>

                    {/* Property title */}
                    <h3
                      onClick={b.status === 'COMPLETED' ? undefined : () => navigate(`/my-bookings/${b.code}`)}
                      style={{
                        margin: '0 0 0.35rem',
                        fontSize: '1.3rem',
                        fontWeight: 800,
                        color: 'var(--color-text-primary)',
                        cursor: b.status === 'COMPLETED' ? 'default' : 'pointer',
                        lineHeight: 1.3
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                    >
                      {b.propertyName}
                    </h3>

                    {/* City & Address */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: '0.85rem' }}>
                      <GeoAltFill style={{ color: 'var(--color-primary)', fontSize: '0.9rem', flexShrink: 0 }} />
                      <span>{city}</span>
                      <span>·</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Hạng phòng: {b.roomName}</span>
                    </div>

                    {/* Checkin Checkout Time Frame */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '0.75rem',
                      background: 'var(--color-bg-app)',
                      padding: '0.85rem 1.15rem',
                      borderRadius: 14,
                      border: '1px solid var(--color-border-subtle)',
                      fontSize: '0.86rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CalendarCheck style={{ color: 'var(--color-primary)', fontSize: '1.1rem', flexShrink: 0 }} />
                        <div>
                          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Nhận - Trả phòng</span>
                          <strong style={{ color: 'var(--color-text-primary)' }}>{b.checkIn} → {b.checkOut}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PeopleFill style={{ color: 'var(--color-info)', fontSize: '1.1rem', flexShrink: 0 }} />
                        <div>
                          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Số khách</span>
                          <strong style={{ color: 'var(--color-text-primary)' }}>{b.guests} khách lưu trú</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guest Name & contact */}
                  <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Người nhận phòng:</span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{b.guestName}</strong>
                    <span>({b.guestPhone})</span>
                  </div>
                </div>

                {/* ── Right: Pricing & Action Buttons ── */}
                <div style={{
                  padding: '1.5rem 1.75rem',
                  borderLeft: '1px solid var(--color-bg-muted)',
                  background: 'var(--color-bg-app)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  minWidth: 220,
                  textAlign: 'right'
                }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                      Tổng tiền thanh toán
                    </span>
                    <strong style={{ fontSize: '1.55rem', color: 'var(--color-primary)', fontWeight: 800, display: 'block', margin: '0.2rem 0 0.15rem' }}>
                      {formatVND(b.total)}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-success)', fontWeight: 600, display: 'block' }}>
                      Miễn phí phí dịch vụ
                    </span>
                  </div>

                  {/* Action Button stack */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', width: '100%', marginTop: '1rem' }}>
                    {b.status !== 'COMPLETED' && <button
                      type="button"
                      onClick={() => navigate(`/my-bookings/${b.code}`)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 1.15rem',
                        borderRadius: 10,
                        background: 'var(--color-text-primary)',
                        color: 'var(--color-bg-surface)',
                        border: 'none',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'background 0.2s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-text-primary)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-text-primary)')}
                    >
                      Chi tiết đặt phòng <ArrowRight style={{ fontSize: '0.85rem' }} />
                    </button>}

                    {/* Nếu đơn đã hoàn thành và CHƯA đánh giá -> Hiển thị nút "Viết đánh giá" */}
                    {b.status === 'COMPLETED' && !b.isReviewed && !(b as any).is_reviewed && !store.isBookingReviewed(b.code) && !reviewedCodes.has(b.code) && (
                      <button
                        type="button"
                        onClick={() => navigate(`/review?bookingCode=${b.code}`)}
                        style={{
                          width: '100%',
                          padding: '0.6rem 1rem',
                          borderRadius: 10,
                          background: 'var(--color-primary-soft)',
                          color: 'var(--color-primary)',
                          border: '1px solid var(--color-primary-border)',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <PencilSquare /> Viết đánh giá
                      </button>
                    )}

                    {/* Nếu đơn đã hoàn thành và ĐÃ ĐÁNH GIÁ -> TUYỆT ĐỐI KHÔNG hiện "Viết đánh giá", chỉ hiện "Xem đánh giá" & "Đặt lại" */}
                    {b.status === 'COMPLETED' && Boolean(b.isReviewed || (b as any).is_reviewed || store.isBookingReviewed(b.code) || reviewedCodes.has(b.code)) && (
                      <button
                        type="button"
                        onClick={() => navigate(`/property/${b.propertyId || 1}`)}
                        style={{
                          width: '100%',
                          padding: '0.6rem 1rem',
                          borderRadius: 10,
                          background: 'var(--color-bg-app)',
                          color: 'var(--color-text-secondary)',
                          border: '1px solid var(--color-border-subtle)',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <ArrowRepeat /> Đặt lại chỗ này
                      </button>
                    )}

                    {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                      <button
                        type="button"
                        onClick={() => handleCancelBooking(b.code)}
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.9rem',
                          borderRadius: 10,
                          background: 'transparent',
                          color: 'var(--color-danger)',
                          border: '1px solid var(--color-danger-border)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 5,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'var(--color-danger-bg)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <XCircle /> Hủy đặt phòng
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {pageCount > 1 && (
        <nav aria-label="Phân trang lịch sử đặt phòng" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: '2rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setCurrentPage(page => Math.max(1, page - 1))} disabled={currentPage === 1} aria-label="Trang trước" style={{ padding: '0.55rem 0.9rem', border: '1px solid var(--color-border-subtle)', borderRadius: 10, background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}>
            Trước
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map(page => (
            <button key={page} type="button" onClick={() => setCurrentPage(page)} aria-current={currentPage === page ? 'page' : undefined} style={{ minWidth: 40, height: 40, border: `1px solid ${currentPage === page ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`, borderRadius: 10, background: currentPage === page ? 'var(--color-primary)' : 'var(--color-bg-surface)', color: currentPage === page ? '#fff' : 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 700 }}>
              {page}
            </button>
          ))}
          <button type="button" onClick={() => setCurrentPage(page => Math.min(pageCount, page + 1))} disabled={currentPage === pageCount} aria-label="Trang sau" style={{ padding: '0.55rem 0.9rem', border: '1px solid var(--color-border-subtle)', borderRadius: 10, background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', cursor: currentPage === pageCount ? 'not-allowed' : 'pointer', opacity: currentPage === pageCount ? 0.5 : 1 }}>
            Sau
          </button>
        </nav>
      )}
    </div>
  );
}
