// Standardized "Trips" (Chuyến đi của tôi) Page (TypeScript)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { formatVND } from '../../constants';
import { Button, Card, Badge, Tabs } from '../../components';
import {
  HouseDoor,
  Search,
  PencilSquare,
} from 'react-bootstrap-icons';

export default function MyBookingsPage() {
  const { store, currentUser, addToast } = useStore();
  const navigate = useNavigate();
  const username = currentUser?.username || 'guest.demo';

  const [activeTab, setActiveTab] = useState('UPCOMING');

  const myBookings = store.getMyBookings(username);

  const filteredBookings = myBookings.filter(b => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UPCOMING') return b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'CHECKED_IN';
    if (activeTab === 'COMPLETED') return b.status === 'COMPLETED';
    if (activeTab === 'CANCELLED') return b.status === 'CANCELLED' || b.status === 'REJECTED';
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
        return <Badge variant="pending">Chờ chủ nhà xác nhận</Badge>;
      case 'CONFIRMED':
        return <Badge variant="active">Đã xác nhận đặt chỗ</Badge>;
      case 'CHECKED_IN':
        return <Badge variant="info">Đang lưu trú</Badge>;
      case 'COMPLETED':
        return <Badge variant="completed">Đã hoàn thành chuyến đi</Badge>;
      case 'CANCELLED':
        return <Badge variant="cancelled">Đã hủy</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const upcomingCount = myBookings.filter(b => ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(b.status)).length;
  const completedCount = myBookings.filter(b => b.status === 'COMPLETED').length;
  const cancelledCount = myBookings.filter(b => ['CANCELLED', 'REJECTED'].includes(b.status)).length;

  return (
    <div style={{ maxWidth: 1040, margin: '2rem auto 5rem', padding: '0 1.5rem' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.35rem', color: '#222222' }}>
            Chuyến đi của bạn
          </h1>
          <p style={{ margin: 0, color: '#717171', fontSize: '0.95rem' }}>
            Quản lý tất cả kỳ nghỉ dưỡng và lịch sử lưu trú của tài khoản <strong>{currentUser?.fullName || username}</strong>
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<Search />}
          onClick={() => navigate('/')}
        >
          Tìm chuyến đi mới
        </Button>
      </div>

      {/* Standardized Tabs */}
      <Tabs
        activeId={activeTab}
        onChange={id => setActiveTab(id)}
        items={[
          { id: 'UPCOMING', label: 'Sắp tới & Chờ duyệt', count: upcomingCount },
          { id: 'COMPLETED', label: 'Đã hoàn thành', count: completedCount },
          { id: 'CANCELLED', label: 'Đã hủy', count: cancelledCount },
          { id: 'ALL', label: 'Tất cả chuyến đi', count: myBookings.length },
        ]}
      />

      {/* Trips Content */}
      {filteredBookings.length === 0 ? (
        <Card variant="outline" padding="lg" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <HouseDoor style={{ fontSize: '3rem', color: '#B0B0B0', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#222222' }}>
            Chưa có chuyến đi nào trong mục này
          </h2>
          <p style={{ color: '#717171', maxWidth: 450, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            Đã đến lúc phủi bụi cho chiếc vali và bắt đầu lên kế hoạch cho kỳ nghỉ tiếp theo của bạn rồi!
          </p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Bắt đầu tìm kiếm
          </Button>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredBookings.map(b => (
            <Card key={b.code} variant="default" padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                {/* Trip Info */}
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: '12px',
                      background: '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <HouseDoor style={{ fontSize: '2rem', color: '#B0B0B0' }} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      {getStatusBadge(b.status)}
                      <span style={{ fontSize: '0.8rem', color: '#717171', fontFamily: 'monospace' }}>
                        #{b.code}
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 700, color: '#222222' }}>
                      {b.propertyName}
                    </h3>

                    <p style={{ margin: '0 0 0.35rem', color: '#222222', fontSize: '0.9rem' }}>
                      {b.roomName} · {b.guests} khách
                    </p>

                    <p style={{ margin: 0, color: '#717171', fontSize: '0.85rem' }}>
                      {b.checkIn} – {b.checkOut} ({b.nights} đêm) · Tổng: <strong>{formatVND(b.total)}</strong>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/my-bookings/${b.code}`)}
                  >
                    Chi tiết
                  </Button>

                  {b.status === 'COMPLETED' && !b.isReviewed && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<PencilSquare />}
                      onClick={() => navigate(`/review?bookingCode=${b.code}`)}
                    >
                      Viết đánh giá
                    </Button>
                  )}

                  {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleCancelBooking(b.code)}
                    >
                      Hủy phòng
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
