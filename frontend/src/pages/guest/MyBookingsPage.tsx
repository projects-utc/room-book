// Standardized "Trips" (Chuyến đi của tôi) Page (Airbnb Luxury Style)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { formatVND } from '../../constants';
import { Button, Badge } from '../../components';
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
  StarFill,
} from 'react-bootstrap-icons';

export default function MyBookingsPage() {
  const { store, currentUser, addToast } = useStore();
  const navigate = useNavigate();
  const username = currentUser?.username || 'guest.demo';

  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'ALL'>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');

  const myBookings = store.getMyBookings(username);

  // Filter bookings by tab and search
  const filteredBookings = myBookings.filter(b => {
    let matchesTab = true;
    if (activeTab === 'UPCOMING') {
      matchesTab = ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(b.status);
    } else if (activeTab === 'COMPLETED') {
      matchesTab = b.status === 'COMPLETED';
    } else if (activeTab === 'CANCELLED') {
      matchesTab = ['CANCELLED', 'REJECTED'].includes(b.status);
    }

    if (!matchesTab) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = b.propertyName?.toLowerCase().includes(q);
      const matchCode = b.code?.toLowerCase().includes(q);
      const matchRoom = b.roomName?.toLowerCase().includes(q);
      return matchName || matchCode || matchRoom;
    }

    return true;
  });

  const handleCancelBooking = (code: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy đơn đặt phòng #${code}?`)) {
      const res = store.cancelBooking(code);
      if (res.success) {
        addToast(`Đã hủy thành công đơn #${code}`, 'success');
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
            background: '#FFFBEB',
            color: '#B45309',
            border: '1px solid #FDE68A',
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
            background: '#EFF6FF',
            color: '#1D4ED8',
            border: '1px solid #BFDBFE',
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
            background: '#ECFDF5',
            color: '#047857',
            border: '1px solid #A7F3D0',
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
            background: '#F1F5F9',
            color: '#334155',
            border: '1px solid #CBD5E1',
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
            background: '#FEF2F2',
            color: '#B91C1C',
            border: '1px solid #FECACA',
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

  const upcomingCount = myBookings.filter(b => ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(b.status)).length;
  const completedCount = myBookings.filter(b => b.status === 'COMPLETED').length;
  const cancelledCount = myBookings.filter(b => ['CANCELLED', 'REJECTED'].includes(b.status)).length;

  return (
    <div style={{ maxWidth: 1120, margin: '2rem auto 5rem', padding: '0 1.5rem' }}>
      {/* ── Top Header Section ── */}
      <div style={{
        background: 'linear-gradient(135deg, #FFF1F2 0%, #FFFFFF 60%, #F8FAFC 100%)',
        borderRadius: 24,
        padding: '2.25rem 2.5rem',
        border: '1px solid #FFE4E6',
        boxShadow: '0 4px 20px rgba(225, 29, 72, 0.04)',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: '#FFF1F2', color: '#E11D48', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
            <span>Kỳ nghỉ của tôi</span>
          </div>
          <h1 style={{ fontSize: '2.15rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#0F172A', letterSpacing: '-0.02em' }}>
            Chuyến đi của bạn
          </h1>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.98rem' }}>
            Chào mừng trở lại, <strong>{currentUser?.fullName || username}</strong>! Bạn có <strong style={{ color: '#E11D48' }}>{upcomingCount}</strong> chuyến đi sắp tới.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            background: 'linear-gradient(135deg, #FF385C 0%, #E00B41 100%)',
            color: '#ffffff',
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div
          onClick={() => setActiveTab('UPCOMING')}
          style={{
            background: activeTab === 'UPCOMING' ? '#FFF1F2' : '#ffffff',
            border: activeTab === 'UPCOMING' ? '2px solid #E11D48' : '1px solid #E2E8F0',
            borderRadius: 16,
            padding: '1.15rem 1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'UPCOMING' ? '0 4px 16px rgba(225, 29, 72, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
            <CalendarCheck />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', fontWeight: 600 }}>Sắp tới & Chờ duyệt</span>
            <strong style={{ fontSize: '1.35rem', color: '#0F172A' }}>{upcomingCount}</strong>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('COMPLETED')}
          style={{
            background: activeTab === 'COMPLETED' ? '#F0FDF4' : '#ffffff',
            border: activeTab === 'COMPLETED' ? '2px solid #16A34A' : '1px solid #E2E8F0',
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
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ECFDF5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
            <CheckCircleFill />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', fontWeight: 600 }}>Đã hoàn thành</span>
            <strong style={{ fontSize: '1.35rem', color: '#0F172A' }}>{completedCount}</strong>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('CANCELLED')}
          style={{
            background: activeTab === 'CANCELLED' ? '#FEF2F2' : '#ffffff',
            border: activeTab === 'CANCELLED' ? '2px solid #DC2626' : '1px solid #E2E8F0',
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
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF2F2', color: '#B91C1C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
            <XCircleFill />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', fontWeight: 600 }}>Đã hủy</span>
            <strong style={{ fontSize: '1.35rem', color: '#0F172A' }}>{cancelledCount}</strong>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('ALL')}
          style={{
            background: activeTab === 'ALL' ? '#F8FAFC' : '#ffffff',
            border: activeTab === 'ALL' ? '2px solid #0F172A' : '1px solid #E2E8F0',
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
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F1F5F9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
            <HouseDoor />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', fontWeight: 600 }}>Tất cả chuyến đi</span>
            <strong style={{ fontSize: '1.35rem', color: '#0F172A' }}>{myBookings.length}</strong>
          </div>
        </div>
      </div>

      {/* ── Search Bar in trips ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{
          position: 'relative',
          flex: '1 1 320px',
          maxWidth: 420
        }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '1rem' }} />
          <input
            type="text"
            placeholder="Tìm theo tên chỗ nghỉ, mã đơn #ODD..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.7rem 1rem 0.7rem 2.5rem',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              background: '#ffffff',
              fontSize: '0.9rem',
              color: '#0F172A',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = '#E11D48';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(225, 29, 72, 0.12)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        <span style={{ fontSize: '0.88rem', color: '#64748B' }}>
          Đang hiển thị <strong>{filteredBookings.length}</strong> / {myBookings.length} chuyến đi
        </span>
      </div>

      {/* ── Trips Cards List ── */}
      {filteredBookings.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: 24,
          padding: '4.5rem 2rem',
          textAlign: 'center',
          border: '1px dashed #CBD5E1',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#FFF1F2', color: '#E11D48', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2.5rem' }}>
            <HouseDoor />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#0F172A' }}>
            Chưa tìm thấy chuyến đi nào
          </h2>
          <p style={{ color: '#64748B', maxWidth: 440, margin: '0 auto 1.75rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
            {searchQuery
              ? `Không có chuyến đi nào phù hợp với từ khóa "${searchQuery}". Hãy thử tìm kiếm bằng từ khóa khác.`
              : 'Đã đến lúc chuẩn bị hành lý và lên kế hoạch cho kỳ nghỉ dưỡng mơ ước cùng ODauDay Stay!'}
          </p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); navigate('/'); }}
            style={{
              background: 'linear-gradient(135deg, #FF385C 0%, #E00B41 100%)',
              color: '#ffffff',
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
          {filteredBookings.map(b => {
            // Find property object to fetch real image & details
            const property = store.getProperty(b.propertyId) || store.getAllProperties().find(p => p.name === b.propertyName) || store.getProperty(1);
            const propertyImg = property?.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
            const city = property?.city || 'Hà Nội';

            return (
              <div
                key={b.code}
                className="my-trip-card"
                style={{
                  background: '#ffffff',
                  border: '1px solid #E2E8F0',
                  borderRadius: 20,
                  overflow: 'hidden',
                  boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                  alignItems: 'stretch',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 28px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                {/* ── Left: Property Photo ── */}
                <div
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    minHeight: 220,
                  }}
                  onClick={() => navigate(`/my-bookings/${b.code}`)}
                >
                  <img
                    src={propertyImg}
                    alt={b.propertyName}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.35s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />

                  {/* Top-left stay code */}
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
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
                    color: '#0F172A',
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
                      <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                        Đặt ngày {b.createdAt || 'Gần đây'}
                      </span>
                    </div>

                    {/* Property title */}
                    <h3
                      onClick={() => navigate(`/my-bookings/${b.code}`)}
                      style={{
                        margin: '0 0 0.35rem',
                        fontSize: '1.3rem',
                        fontWeight: 800,
                        color: '#0F172A',
                        cursor: 'pointer',
                        lineHeight: 1.3
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#E11D48')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#0F172A')}
                    >
                      {b.propertyName}
                    </h3>

                    {/* City & Address */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: '0.88rem', marginBottom: '0.85rem' }}>
                      <GeoAltFill style={{ color: '#E11D48', fontSize: '0.9rem', flexShrink: 0 }} />
                      <span>{city}</span>
                      <span>·</span>
                      <span style={{ fontWeight: 600, color: '#334155' }}>Hạng phòng: {b.roomName}</span>
                    </div>

                    {/* Checkin Checkout Time Frame */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '0.75rem',
                      background: '#F8FAFC',
                      padding: '0.85rem 1.15rem',
                      borderRadius: 14,
                      border: '1px solid #E2E8F0',
                      fontSize: '0.86rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CalendarCheck style={{ color: '#E11D48', fontSize: '1.1rem', flexShrink: 0 }} />
                        <div>
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Nhận - Trả phòng</span>
                          <strong style={{ color: '#0F172A' }}>{b.checkIn} → {b.checkOut}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PeopleFill style={{ color: '#0284C7', fontSize: '1.1rem', flexShrink: 0 }} />
                        <div>
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Số khách</span>
                          <strong style={{ color: '#0F172A' }}>{b.guests} khách lưu trú</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guest Name & contact */}
                  <div style={{ fontSize: '0.84rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Đại diện đặt phòng:</span>
                    <strong style={{ color: '#1E293B' }}>{b.guestName}</strong>
                    <span>({b.guestPhone})</span>
                  </div>
                </div>

                {/* ── Right: Pricing & Action Buttons ── */}
                <div style={{
                  padding: '1.5rem 1.75rem',
                  borderLeft: '1px solid #F1F5F9',
                  background: '#FCFDFF',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  minWidth: 220,
                  textAlign: 'right'
                }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                      Tổng tiền thanh toán
                    </span>
                    <strong style={{ fontSize: '1.55rem', color: '#E11D48', fontWeight: 800, display: 'block', margin: '0.2rem 0 0.15rem' }}>
                      {formatVND(b.total)}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600, display: 'block' }}>
                      Miễn phí phí dịch vụ
                    </span>
                  </div>

                  {/* Action Button stack */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', width: '100%', marginTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/my-bookings/${b.code}`)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 1.15rem',
                        borderRadius: 10,
                        background: '#0F172A',
                        color: '#ffffff',
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
                      onMouseEnter={e => (e.currentTarget.style.background = '#1E293B')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#0F172A')}
                    >
                      Chi tiết <ArrowRight style={{ fontSize: '0.85rem' }} />
                    </button>

                    {b.status === 'COMPLETED' && !b.isReviewed && (
                      <button
                        type="button"
                        onClick={() => navigate(`/review?bookingCode=${b.code}`)}
                        style={{
                          width: '100%',
                          padding: '0.6rem 1rem',
                          borderRadius: 10,
                          background: '#FFF1F2',
                          color: '#E11D48',
                          border: '1px solid #FECDD3',
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

                    {b.status === 'COMPLETED' && b.isReviewed && (
                      <button
                        type="button"
                        onClick={() => navigate(`/property/${b.propertyId || 1}#reviews`)}
                        style={{
                          width: '100%',
                          padding: '0.6rem 1rem',
                          borderRadius: 10,
                          background: '#FFFBEB',
                          color: '#B45309',
                          border: '1px solid #FDE68A',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <StarFill style={{ color: '#F59E0B' }} /> Xem đánh giá
                      </button>
                    )}

                    {b.status === 'COMPLETED' && b.isReviewed && (
                      <button
                        type="button"
                        onClick={() => navigate(`/property/${b.propertyId || 1}`)}
                        style={{
                          width: '100%',
                          padding: '0.6rem 1rem',
                          borderRadius: 10,
                          background: '#F8FAFC',
                          color: '#475569',
                          border: '1px solid #E2E8F0',
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
                          color: '#DC2626',
                          border: '1px solid #FCA5A5',
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
                          e.currentTarget.style.background = '#FEF2F2';
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
    </div>
  );
}
