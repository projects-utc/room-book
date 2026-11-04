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
  XCircle,
  PencilSquare,
  ChevronLeft,
  StarFill,
  ShieldCheck,
  CalendarCheck,
  PersonBadge,
  CreditCard,
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
        return <span style={{ background: '#FEF3C7', color: '#B45309', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #FDE68A' }}>Chờ chủ nhà duyệt</span>;
      case 'CONFIRMED':
        return <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #BAE6FD' }}>Đã xác nhận</span>;
      case 'CHECKED_IN':
        return <span style={{ background: '#EEF2FF', color: '#4338CA', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #C7D2FE' }}>Đang lưu trú</span>;
        // SỬA MÀU SẮC CHO TRẠNG THÁI "ĐÃ HOÀN THÀNH" (XANH LÁ TƯƠI SÁNG)
      case 'COMPLETED':
        return <span style={{ background: '#ECFDF5', color: '#059669', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #A7F3D0' }}>✓ Đã hoàn thành</span>;
      case 'CANCELLED':
        return <span style={{ background: '#FFF1F2', color: '#BE123C', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #FECDD3' }}>Đã hủy</span>;
      default:
        return <span style={{ background: '#F1F5F9', color: '#475569', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>{status}</span>;
    }
  };

  // Lấy dữ liệu bài đánh giá nếu đơn này đã được review
  const myReview = booking?.isReviewed ? store.getReviewsByProperty(booking.propertyId).find(r => r.bookingCode === bookingCode) : null;

  // Ảnh minh họa phòng (nếu booking chưa có sẵn roomImage)
  const roomImage = (booking as any)?.roomImage || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&auto=format&fit=crop&q=80';
  const paymentText = (booking as any)?.paymentMethod === 'BANK_TRANSFER'
      ? 'Chuyển khoản ngân hàng (Đã thanh toán 100%)'
      : ((booking as any)?.paymentMethod === 'VNPAY'
          ? 'Thanh toán qua cổng VNPAY (Đã thanh toán 100%)'
          : 'Thanh toán trực tiếp khi nhận phòng (COD)');

  return (
      <div style={{ maxWidth: 1000, margin: '2rem auto 5rem', padding: '0 1.5rem' }}>
        {/* Breadcrumb */}
        <Breadcrumb
            items={[
              { label: 'Trang chủ', to: '/' },
              { label: 'Chuyến đi', to: '/my-bookings' },
              { label: `Đơn #${bookingCode}` },
            ]}
        />

        {/* Header cải tiến gọn gàng và tinh tế hơn */}
        <div style={{
          background: '#ffffff',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '1px solid #EBEBEB',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#1E293B' }}>
                Chi tiết chuyến đi #{bookingCode}
              </h1>
              <div>{getStatusBadge(currentStatus)}</div>
            </div>
            <span style={{ color: '#64748B', fontSize: '0.88rem' }}>
            Đặt vào ngày {booking?.createdAt || '2026-11-04'}
          </span>
          </div>

          {/*/!* Nút thao tác nhanh hoặc thông tin phụ bên phải nếu cần *!/*/}
          {/*<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>*/}
          {/*  {currentStatus === 'COMPLETED' && !booking?.isReviewed && (*/}
          {/*      <Link to={`/review?bookingCode=${bookingCode}`} style={{ textDecoration: 'none' }}>*/}
          {/*        <Button variant="primary" size="sm" icon={<PencilSquare />}>*/}
          {/*          Viết đánh giá*/}
          {/*        </Button>*/}
          {/*      </Link>*/}
          {/*  )}*/}
          {/*</div>*/}
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

        {/* 2-Column Detail Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 380px)', gap: '2rem', alignItems: 'start' }}>

          {/* Left Column: Stay Info & Review */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Card title="Thông tin đặt phòng" variant="default">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Thêm Thumbnail Homestay cho sinh động */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <img src={roomImage} alt={booking?.roomName || 'Phòng'} style={{ width: '72px', height: '72px', borderRadius: '10px', objectFit: 'cover' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 700, color: '#FF385C', backgroundColor: '#FFF0F3', padding: '2px 8px', borderRadius: '999px', marginBottom: '4px' }}>
                      {booking?.roomName || 'Phòng Stay'}
                    </div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {booking?.propertyName || 'ODauDay Stay'}
                    </h4>
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <CalendarCheck style={{ fontSize: '1.2rem', color: '#64748B', marginTop: '2px' }} />
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Thời gian lưu trú</span>
                    <strong style={{ fontSize: '0.98rem', display: 'block', margin: '0.2rem 0', color: '#1E293B' }}>
                      {booking?.checkIn} (Nhận phòng 14:00) → {booking?.checkOut} (Trả phòng 12:00)
                    </strong>
                    <span style={{ fontSize: '0.88rem', color: '#64748B' }}>
                    {booking?.nights || 1} đêm · {booking?.guests || 1} khách
                  </span>
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <PersonBadge style={{ fontSize: '1.2rem', color: '#64748B', marginTop: '2px' }} />
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Thông tin người đặt phòng</span>
                    <strong style={{ fontSize: '0.95rem', display: 'block', margin: '0.2rem 0', color: '#1E293B' }}>
                      {booking?.guestName || 'ĐOÀN TẤN PHÁT'}
                    </strong>
                    <span style={{ fontSize: '0.86rem', color: '#64748B' }}>
                    {booking?.guestPhone || '0396589808'} · {booking?.guestEmail || 'phatdoan2112@gmail.com'}
                  </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <CreditCard style={{ fontSize: '1.2rem', color: '#64748B', marginTop: '2px' }} />
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Hình thức thanh toán</span>
                    <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#059669', display: 'inline-block', marginTop: '2px' }}>
                    {paymentText}
                  </span>
                  </div>
                </div>

              </div>
            </Card>

            {/* HIỂN THỊ ĐÁNH GIÁ CỦA BẠN NẾU ĐÃ REVIEW */}
            {myReview && (
                <Card title="Đánh giá của bạn về chuyến đi" variant="default" style={{ background: 'linear-gradient(135deg, #FFFDF5 0%, #FFFBEB 100%)', borderColor: '#FDE68A' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', padding: '4px 12px', borderRadius: '999px', border: '1px solid #FDE68A' }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <StarFill key={i} style={{ color: i < myReview.rating ? '#FFB400' : '#E2E8F0', fontSize: '0.9rem' }} />
                        ))}
                        <span style={{ marginLeft: '4px', fontSize: '0.85rem', fontWeight: 800, color: '#B45309' }}>{myReview.rating}.0</span>
                      </div>
                      <span style={{ fontSize: '0.82rem', color: '#64748B' }}>{myReview.date}</span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', lineHeight: 1.6, fontStyle: 'italic' }}>
                      "{myReview.comment}"
                    </p>

                    <Link to={`/property/${booking?.propertyId || 1}?highlight=${bookingCode}#reviews-section`} style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FF385C', marginTop: '0.25rem', display: 'inline-block', textDecoration: 'none' }}>
                      Xem đánh giá nổi bật tại trang chỗ ở →
                    </Link>
                  </div>
                </Card>
            )}
          </div>

          {/* Right Column: Price & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Card title="Chi tiết thanh toán">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.92rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>Giá lưu trú ({booking?.nights || 1} đêm)</span>
                  <span style={{ fontWeight: 600 }}>{formatVND(booking?.total || 650000)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>Phí dịch vụ ODauDay</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>0₫ (Miễn phí)</span>
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
                  <span style={{ color: '#FF385C' }}>{formatVND(booking?.total || 650000)}</span>
                </div>
              </div>
            </Card>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* Chỉ hiện nút Viết Đánh Giá nếu chưa review và đơn đã hoàn thành */}
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