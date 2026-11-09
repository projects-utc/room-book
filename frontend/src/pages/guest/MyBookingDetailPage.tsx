// Airbnb-Inspired Booking Detail Page (Redesigned)
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { Breadcrumb } from '../../components';
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
  PersonCheck,
  CheckCircleFill,
  XCircleFill,
  CashCoin,
  CreditCard,
  Building,
  StarFill,
} from 'react-bootstrap-icons';
import { BookingStatus } from '../../constants';

export default function MyBookingDetailPage() {
  const { code } = useParams<{ code: string }>();
  const { store, addToast } = useStore();
  const navigate = useNavigate();

  const bookingCode = code || 'ODD-DEMO-0002';
  const booking = store.getBooking(bookingCode) || store.getAllBookings()[0];
  const [currentStatus, setCurrentStatus] = useState<BookingStatus>(booking?.status || 'PENDING');

  // Find real property
  const property = store.getProperty(booking?.propertyId) || store.getAllProperties().find(p => p.name === booking?.propertyName) || store.getProperty(1);
  const propertyImg = property?.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

  const handleCancel = () => {
    if (['CHECKED_IN', 'COMPLETED'].includes(currentStatus)) {
      addToast('Từ chối hủy đơn: Khách đã nhận phòng hoặc đã hoàn tất lưu trú!', 'error');
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn hủy đơn đặt phòng #${bookingCode}?`)) {
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
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 999,
            background: '#FFFBEB',
            color: '#B45309',
            border: '1px solid #FDE68A',
            fontSize: '0.85rem',
            fontWeight: 700
          }}>
            <ClockHistory /> Chờ chủ nhà duyệt
          </span>
        );
      case 'CONFIRMED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 999,
            background: '#EFF6FF',
            color: '#1D4ED8',
            border: '1px solid #BFDBFE',
            fontSize: '0.85rem',
            fontWeight: 700
          }}>
            <CheckCircleFill /> Đã xác nhận đặt chỗ
          </span>
        );
      case 'CHECKED_IN':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 999,
            background: '#ECFDF5',
            color: '#047857',
            border: '1px solid #A7F3D0',
            fontSize: '0.85rem',
            fontWeight: 700
          }}>
            <HouseDoor /> Đang lưu trú
          </span>
        );
      case 'COMPLETED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 999,
            background: '#F1F5F9',
            color: '#334155',
            border: '1px solid #CBD5E1',
            fontSize: '0.85rem',
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
            gap: 6,
            padding: '6px 14px',
            borderRadius: 999,
            background: '#FEF2F2',
            color: '#B91C1C',
            border: '1px solid #FECACA',
            fontSize: '0.85rem',
            fontWeight: 700
          }}>
            <XCircleFill /> Đã hủy đơn
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div style={{ maxWidth: 1040, margin: '2rem auto 5rem', padding: '0 1.5rem' }}>
      {/* ── Breadcrumb ── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Breadcrumb
          items={[
            { label: 'Trang chủ', to: '/' },
            { label: 'Chuyến đi của bạn', to: '/my-bookings' },
            { label: `Đơn #${bookingCode}` },
          ]}
        />
      </div>

      {/* ── Header Title & Actions ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid #E2E8F0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => navigate('/my-bookings')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              background: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F172A',
              transition: 'background 0.15s ease',
            }}
          >
            <ChevronLeft style={{ fontSize: '1.1rem' }} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#0F172A', letterSpacing: '-0.02em' }}>
              Chi tiết kỳ nghỉ #{bookingCode}
            </h1>
            <span style={{ color: '#64748B', fontSize: '0.9rem' }}>
              Thời điểm đặt: <strong>{booking?.createdAt || 'Gần đây'}</strong>
            </span>
          </div>
        </div>

        <div>{getStatusBadge(currentStatus)}</div>
      </div>

      {/* ── Status Banner Message ── */}
      {currentStatus === 'CANCELLED' ? (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 16,
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: '#991B1B'
        }}>
          <XCircleFill style={{ fontSize: '1.5rem', flexShrink: 0 }} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.98rem', marginBottom: 2 }}>Đơn đặt phòng này đã được hủy</strong>
            <span style={{ fontSize: '0.88rem', color: '#B91C1C' }}>
              Khoảng thời gian này đã được giải phóng trên hệ thống. Nếu có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ khách hàng.
            </span>
          </div>
        </div>
      ) : currentStatus === 'CONFIRMED' ? (
        <div style={{
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: 16,
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: '#1E40AF'
        }}>
          <CheckCircleFill style={{ fontSize: '1.5rem', color: '#2563EB', flexShrink: 0 }} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.98rem', marginBottom: 2 }}>Chỗ ở đã được xác nhận thành công!</strong>
            <span style={{ fontSize: '0.88rem', color: '#1D4ED8' }}>
              Chủ nhà đã chuẩn bị sẵn sàng đón bạn vào ngày {booking?.checkIn}. Chúc bạn có kỳ nghỉ thật tuyệt vời!
            </span>
          </div>
        </div>
      ) : currentStatus === 'PENDING' ? (
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: 16,
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: '#92400E'
        }}>
          <ClockHistory style={{ fontSize: '1.5rem', color: '#D97706', flexShrink: 0 }} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.98rem', marginBottom: 2 }}>Đang chờ chủ nhà xác nhận</strong>
            <span style={{ fontSize: '0.88rem', color: '#B45309' }}>
              Yêu cầu đặt phòng của bạn đã được gửi tới chủ nhà. Thông thường chủ nhà sẽ phản hồi trong vòng vài giờ.
            </span>
          </div>
        </div>
      ) : null}

      {/* ── 2-Column Content Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 380px)', gap: '2.5rem', alignItems: 'start' }}>
        {/* ── CỘT TRÁI: THÔNG TIN NGHỈ DƯỠNG ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Card Chỗ ở */}
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
          }}>
            <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
              <img
                src={propertyImg}
                alt={booking?.propertyName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                top: 14,
                left: 14,
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(4px)',
                padding: '5px 12px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#0F172A'
              }}>
                {property?.type || 'Homestay'} · {property?.city || 'Hà Nội'}
              </div>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.4rem', color: '#0F172A' }}>
                {booking?.propertyName}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                <GeoAltFill style={{ color: '#E11D48' }} />
                <span>{property?.address || 'Khu vực trung tâm'}</span>
              </div>

              {/* Hạng phòng */}
              <div style={{
                background: '#F8FAFC',
                borderRadius: 14,
                padding: '1rem 1.25rem',
                border: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Hạng phòng</span>
                  <strong style={{ display: 'block', fontSize: '1.05rem', color: '#0F172A', marginTop: 2 }}>{booking?.roomName}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/property/${booking?.propertyId || 1}`)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #CBD5E1',
                    borderRadius: 10,
                    padding: '0.5rem 1rem',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#0F172A',
                    cursor: 'pointer'
                  }}
                >
                  Xem trang chỗ ở
                </button>
              </div>
            </div>
          </div>

          {/* Lịch trình Check-in / Check-out */}
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #E2E8F0',
            padding: '1.75rem',
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1.25rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarCheck style={{ color: '#E11D48' }} /> Lịch trình chuyến đi
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12, background: '#F8FAFC', padding: '1.25rem', borderRadius: 16, border: '1px solid #E2E8F0' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Nhận phòng</span>
                <strong style={{ fontSize: '1.1rem', color: '#0F172A', display: 'block' }}>{booking?.checkIn}</strong>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Từ 14:00</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#E11D48', fontSize: '0.78rem', fontWeight: 800 }}>
                <span style={{ width: 36, height: 2, background: '#FDA4AF', display: 'block' }} />
                <span style={{ margin: '6px 0', whiteSpace: 'nowrap' }}>{booking?.nights} ĐÊM</span>
                <span style={{ width: 36, height: 2, background: '#FDA4AF', display: 'block' }} />
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Trả phòng</span>
                <strong style={{ fontSize: '1.1rem', color: '#0F172A', display: 'block' }}>{booking?.checkOut}</strong>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Trước 12:00</span>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#475569' }}>
              <span>Số lượng khách:</span>
              <strong style={{ color: '#0F172A' }}>{booking?.guests} khách</strong>
            </div>
          </div>

          {/* Thông tin khách đặt */}
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #E2E8F0',
            padding: '1.75rem',
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1.25rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <PersonCheck style={{ color: '#0284C7' }} /> Thông tin khách lưu trú
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', marginBottom: 2 }}>Người nhận phòng:</span>
                <strong style={{ color: '#0F172A' }}>{booking?.guestName}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', marginBottom: 2 }}>Số điện thoại:</span>
                <strong style={{ color: '#0F172A' }}>{booking?.guestPhone}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', marginBottom: 2 }}>Email nhận xác nhận:</span>
                <strong style={{ color: '#0F172A' }}>{booking?.guestEmail}</strong>
              </div>
            </div>
          </div>

          {/* Card Đánh giá & Phản hồi */}
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #E2E8F0',
            padding: '1.75rem',
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <StarFill style={{ color: '#F59E0B' }} /> Đánh giá & Phản hồi kỳ nghỉ
            </h3>

            {booking?.isReviewed ? (
              <div style={{
                background: '#FFFBEB',
                borderRadius: 14,
                padding: '1.25rem 1.4rem',
                border: '1px solid #FEF3C7',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#92400E', fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
                    <CheckCircleFill style={{ color: '#16A34A' }} /> Đã gửi đánh giá cho kỳ nghỉ này
                  </div>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: '#B45309', lineHeight: 1.5 }}>
                    Đánh giá của bạn đã được hiển thị công khai trên trang thông tin chỗ nghỉ để hỗ trợ cộng đồng du khách.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/property/${booking?.propertyId || 1}#reviews`)}
                  style={{
                    background: '#1E293B',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '0.65rem 1.25rem',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  <StarFill style={{ color: '#F59E0B' }} /> Xem đánh giá trên trang đặt phòng ➔
                </button>
              </div>
            ) : currentStatus === 'COMPLETED' ? (
              <div style={{
                background: '#F8FAFC',
                borderRadius: 14,
                padding: '1.25rem 1.4rem',
                border: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0F172A', marginBottom: 2 }}>
                    Bạn thấy kỳ nghỉ này thế nào?
                  </strong>
                  <span style={{ fontSize: '0.86rem', color: '#64748B' }}>
                    Chia sẻ trải nghiệm thực tế để giúp chủ nhà cải thiện dịch vụ và hỗ trợ các du khách khác.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/property/${booking?.propertyId || 1}#reviews`)}
                    style={{
                      background: '#ffffff',
                      color: '#0F172A',
                      border: '1px solid #CBD5E1',
                      borderRadius: 10,
                      padding: '0.65rem 1.1rem',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Xem các đánh giá ➔
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/review?bookingCode=${bookingCode}`)}
                    style={{
                      background: 'linear-gradient(135deg, #FF385C, #E00B41)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '0.65rem 1.25rem',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <PencilSquare /> Viết đánh giá
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: 14, border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.88rem', color: '#64748B' }}>
                  Xem những nhận xét và đánh giá thực tế từ các du khách khác về <strong>{booking?.propertyName}</strong>.
                </span>
                <button
                  type="button"
                  onClick={() => navigate(`/property/${booking?.propertyId || 1}#reviews`)}
                  style={{
                    background: '#ffffff',
                    color: '#0F172A',
                    border: '1px solid #CBD5E1',
                    borderRadius: 10,
                    padding: '0.55rem 1.1rem',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Xem đánh giá chỗ ở ➔
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── CỘT PHẢI: CHI TIẾT THANH TOÁN & THAO TÁC ── */}
        <aside style={{ position: 'sticky', top: '6rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Box Chi tiết thanh toán */}
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #E2E8F0',
            padding: '1.75rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1.25rem', color: '#0F172A' }}>
              Chi tiết thanh toán
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                <span>Giá phòng ({booking?.nights} đêm)</span>
                <strong style={{ color: '#1E293B' }}>{formatVND(booking?.subtotal || booking?.total || 1300000)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                <span>Phí dịch vụ</span>
                <strong style={{ color: '#059669' }}>0₫ (Miễn phí)</strong>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '0.5rem 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>Tổng thanh toán</span>
                <strong style={{ fontSize: '1.4rem', color: '#E11D48', fontWeight: 800 }}>
                  {formatVND(booking?.total || 1300000)}
                </strong>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1rem',
              background: '#F8FAFC',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              fontSize: '0.84rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#334155', fontWeight: 700, marginBottom: 2 }}>
                <CashCoin style={{ color: '#E11D48', fontSize: '1.1rem' }} /> Hình thức: Tiền mặt khi nhận phòng / Chuyển khoản
              </div>
              <span style={{ color: '#64748B', fontSize: '0.78rem' }}>Mã đối soát hệ thống: #{bookingCode}</span>
            </div>

            {/* BẢO HIỂM CHUYẾN ĐI */}
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: '#ECFDF5', color: '#047857', fontSize: '0.78rem', fontWeight: 700 }}>
              <ShieldCheck style={{ fontSize: '1rem', color: '#059669', flexShrink: 0 }} />
              <span>Chuyến đi được bảo vệ bởi ODauDay Protection</span>
            </div>

            {/* Nút hành động */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
              {/* Nút Xem lại đánh giá nếu đã đánh giá */}
              {booking?.isReviewed ? (
                <button
                  type="button"
                  onClick={() => navigate(`/property/${booking?.propertyId || 1}#reviews`)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1.25rem',
                    background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                    color: '#B45309',
                    border: '1.5px solid #FDE68A',
                    borderRadius: 12,
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <StarFill style={{ color: '#F59E0B' }} /> Xem đánh giá trên trang đặt phòng
                </button>
              ) : currentStatus === 'COMPLETED' ? (
                <button
                  type="button"
                  onClick={() => navigate(`/review?bookingCode=${bookingCode}`)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1.25rem',
                    background: 'linear-gradient(135deg, #FF385C 0%, #E00B41 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)'
                  }}
                >
                  <PencilSquare /> Viết đánh giá kỳ nghỉ
                </button>
              ) : null}

              {/* Nút Xem trang đặt phòng và đánh giá */}
              <button
                type="button"
                onClick={() => navigate(`/property/${booking?.propertyId || 1}#reviews`)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.25rem',
                  background: '#ffffff',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  borderRadius: 12,
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <StarFill style={{ color: '#F59E0B', fontSize: '0.85rem' }} /> Xem đánh giá chỗ ở này
              </button>

              {(currentStatus === 'PENDING' || currentStatus === 'CONFIRMED') && (
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1.25rem',
                    background: 'transparent',
                    color: '#DC2626',
                    border: '1.5px solid #FECACA',
                    borderRadius: 12,
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#FEF2F2';
                    e.currentTarget.style.borderColor = '#DC2626';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#FECACA';
                  }}
                >
                  <XCircle /> Hủy đơn đặt phòng này
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('/my-bookings')}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.25rem',
                  background: '#F8FAFC',
                  color: '#475569',
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ← Quay lại danh sách chuyến đi
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
