// Airbnb-Inspired Booking Detail Page (Standardized Components)
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import {
  Breadcrumb,
  Alert,
  Badge,
  Button,
  Card,
} from '../../components';
import { formatVND } from '../../constants';
import {
  CalendarCheck,
  HouseDoor,
  GeoAltFill,
  ClockHistory,
  XCircle,
  PencilSquare,
  ChevronLeft,
  ShieldCheck,
} from 'react-bootstrap-icons';
import { BookingStatus } from '../../constants';

export default function MyBookingDetailPage() {
  const { code } = useParams<{ code: string }>();
  const { store, addToast } = useStore();
  const navigate = useNavigate();

  const bookingCode = code || 'ODD-DEMO-0002';
  const booking = store.getBooking(bookingCode) || store.getAllBookings()[0];
  const [currentStatus, setCurrentStatus] = useState<BookingStatus>(booking?.status || 'PENDING');

  const handleCancel = () => {
    if (['CHECKED_IN', 'COMPLETED'].includes(currentStatus)) {
      addToast('Từ chối hủy đơn: Khách đã nhận phòng hoặc đã hoàn tất lưu trú!', 'error');
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn hủy đơn #${bookingCode}?`)) {
      const res = store.cancelBooking(bookingCode);
      if (res.success) {
        setCurrentStatus('CANCELLED');
        addToast(`Đã hủy thành công đơn #${bookingCode}`, 'success');
      } else {
        addToast(res.message || 'Lỗi khi hủy đơn', 'error');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning" dot>Chờ chủ nhà duyệt</Badge>;
      case 'CONFIRMED':
        return <Badge variant="success" dot>Đã xác nhận đặt chỗ</Badge>;
      case 'CHECKED_IN':
        return <Badge variant="info" dot>Đang lưu trú</Badge>;
      case 'COMPLETED':
        return <Badge variant="completed" dot>Đã hoàn thành</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger" dot>Đã hủy</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '2rem auto 5rem', padding: '0 1.5rem' }}>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Trang chủ', to: '/' },
          { label: 'Chuyến đi', to: '/my-bookings' },
          { label: `Đơn #${bookingCode}` },
        ]}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0 2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.35rem', color: '#1E293B' }}>
            Chi tiết chuyến đi #{bookingCode}
          </h1>
          <span style={{ color: '#64748B', fontSize: '0.9rem' }}>
            Đặt vào ngày {booking?.createdAt || '02/01/2027'}
          </span>
        </div>
        <div>{getStatusBadge(currentStatus)}</div>
      </div>

      {currentStatus === 'CANCELLED' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert type="warn" title="Đơn đặt phòng này đã được hủy">
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              Chuyến đi đã bị hủy theo yêu cầu. Khoảng thời gian này đã được giải phóng trên lịch phòng của chủ nhà.
            </p>
          </Alert>
        </div>
      )}

      {/* 2-Column Detail Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 360px)', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: Stay Info */}
        <Card title="Thông tin đặt phòng" variant="default">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>
                Cơ sở lưu trú
              </span>
              <strong style={{ fontSize: '1.1rem', display: 'block', margin: '0.2rem 0', color: '#1E293B' }}>
                {booking?.propertyName}
              </strong>
              <span style={{ fontSize: '0.9rem', color: '#475569' }}>
                {booking?.roomName}
              </span>
            </div>

            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>
                Thời gian lưu trú
              </span>
              <strong style={{ fontSize: '1rem', display: 'block', margin: '0.2rem 0', color: '#1E293B' }}>
                {booking?.checkIn} (Nhận phòng 14:00) → {booking?.checkOut} (Trả phòng 12:00)
              </strong>
              <span style={{ fontSize: '0.88rem', color: '#64748B' }}>
                {booking?.nights} đêm · {booking?.guests} khách
              </span>
            </div>

            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>
                Thông tin người đặt phòng
              </span>
              <strong style={{ fontSize: '0.98rem', display: 'block', margin: '0.2rem 0', color: '#1E293B' }}>
                {booking?.guestName}
              </strong>
              <span style={{ fontSize: '0.88rem', color: '#64748B' }}>
                {booking?.guestPhone} · {booking?.guestEmail}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>
                Hình thức thanh toán
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1E293B' }}>
                Thanh toán trực tiếp khi nhận phòng (COD)
              </span>
            </div>
          </div>
        </Card>

        {/* Right Column: Price & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card title="Chi tiết thanh toán">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.92rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Giá lưu trú ({booking?.nights} đêm)</span>
                <span style={{ fontWeight: 600 }}>{formatVND(booking?.total || 1300000)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Phí dịch vụ</span>
                <span style={{ color: '#059669', fontWeight: 600 }}>0₫</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '0.85rem',
                  fontWeight: 800,
                  fontSize: '1.15rem',
                }}
              >
                <span>Tổng cộng</span>
                <span style={{ color: 'var(--airbnb-pink)' }}>{formatVND(booking?.total || 1300000)}</span>
              </div>
            </div>
          </Card>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {currentStatus === 'COMPLETED' && !booking?.isReviewed && (
              <Link to={`/review?bookingCode=${bookingCode}`} style={{ textDecoration: 'none' }}>
                <Button variant="primary" block size="md" icon={<PencilSquare />}>
                  Viết đánh giá lưu trú
                </Button>
              </Link>
            )}

            {(currentStatus === 'PENDING' || currentStatus === 'CONFIRMED') && (
              <Button
                variant="outline"
                block
                size="md"
                icon={<XCircle />}
                style={{ color: '#DC2626', borderColor: '#FECACA' }}
                onClick={handleCancel}
              >
                Hủy đặt phòng
              </Button>
            )}

            <Button
              variant="secondary"
              block
              size="md"
              icon={<ChevronLeft />}
              onClick={() => navigate('/my-bookings')}
            >
              Quay lại danh sách chuyến đi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
