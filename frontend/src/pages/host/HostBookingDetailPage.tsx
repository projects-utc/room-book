// Host Booking Detail Page — Modern Luxury OTA Theme
import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { Breadcrumb, Badge, Button, EmptyState, LoadingSpinner } from '../../components';
import { formatVND, BADGE_LABEL, getBookingPaymentInfo } from '../../constants';
import {
  CalendarCheck,
  CheckLg,
  XCircle,
  KeyFill,
  Check2All,
  ClockHistory,
  ChevronLeft,
  Building,
  DoorOpen,
  TelephoneFill,
  EnvelopeFill,
  GeoAltFill,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  CashCoin,
} from 'react-bootstrap-icons';
import { BookingStatus } from '../../constants';
import type { Booking } from '../../data';
import stayApi from '../../api/stayApi';
import './HostBookingDetailPage.css';

export default function HostBookingDetailPage() {
  const { code } = useParams<{ code: string }>();
  const { store, addToast } = useStore();

  const bookingCode = code || '';
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateInProgress = useRef(false);
  const currentCode = useRef(bookingCode);
  currentCode.current = bookingCode;

  useEffect(() => {
    let active = true;
    setBooking(null);
    setIsLoading(true);
    setLoadError('');
    setNotFound(false);

    const fetchBooking = async () => {
      try {
        if (!bookingCode) {
          if (active) setNotFound(true);
          return;
        }

        const response = await stayApi.getBooking(bookingCode);
        if (!active) return;
        if (!response.success) {
          if (/không tìm thấy|not found/i.test(response.message || '')) {
            setNotFound(true);
          } else {
            setLoadError(response.message || 'Không tải được thông tin đơn từ máy chủ');
          }
          return;
        }
        if (!response.data || response.data.code !== bookingCode) {
          setNotFound(true);
          return;
        }

        setBooking(response.data);
        store.syncBookingFromApi(response.data);
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void fetchBooking();
    return () => { active = false; };
  }, [bookingCode, store, reloadVersion]);

  const handleStatusChange = async (newStatus: BookingStatus) => {
    if (!booking || booking.code !== bookingCode || updateInProgress.current) return;
    updateInProgress.current = true;
    setIsUpdating(true);

    try {
      const response = await stayApi.updateBookingStatus(bookingCode, newStatus);
      if (response.success) {
        const updatedBooking: Booking = {
          ...booking,
          ...response.data,
          status: response.data?.status || newStatus,
        };
        store.syncBookingFromApi(updatedBooking);
        if (currentCode.current === bookingCode) setBooking(updatedBooking);
        addToast(`Đơn #${bookingCode}: ${BADGE_LABEL[updatedBooking.status] || updatedBooking.status}`, 'success');
      } else {
        addToast(response.message || 'Lỗi khi cập nhật trạng thái từ máy chủ', 'error');
      }
    } catch {
      addToast('Không thể kết nối đến máy chủ để đổi trạng thái', 'error');
    } finally {
      updateInProgress.current = false;
      setIsUpdating(false);
    }
  };

  if (isLoading || (booking && booking.code !== bookingCode)) {
    return <LoadingSpinner minHeight="50vh" message="Đang tải thông tin đơn đặt phòng..." />;
  }

  if (notFound || loadError || !booking) {
    return (
      <div role={loadError ? 'alert' : undefined} className="host-booking-detail" style={{ maxWidth: 800 }}>
        <EmptyState
          compact
          title={notFound ? 'Không tìm thấy đơn đặt phòng' : 'Không tải được thông tin đơn'}
          description={notFound ? `Đơn #${bookingCode} không tồn tại hoặc đã bị xóa.` : loadError}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReloadVersion(v => v + 1)}
            >
              Thử lại
            </Button>
          }
          secondaryAction={
            <Link to="/host/bookings" className="btn btn-outline btn-sm">
              Quay lại danh sách đơn
            </Link>
          }
        />
      </div>
    );
  }

  const status = booking.status;
  const { isDeposit30, total: totalVal, paidAmount: paid, remainingAmount: remaining } = getBookingPaymentInfo(booking);
  const paymentLabel = isDeposit30
    ? 'Đặt cọc 30% trực tuyến · Thu 70% còn lại khi nhận phòng'
    : (booking.paymentMethod === 'BANK_TRANSFER' || (booking as any).payment_method === 'BANK_TRANSFER'
      ? 'Chuyển khoản trực tuyến (Đã thanh toán 100%)'
      : 'Thanh toán trực tiếp');

  // Lookup property for image and full address
  const property = store.getProperty(booking.propertyId) ||
    store.getAllProperties().find(p => p.name === booking.propertyName);
  const propertyImage = property?.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

  const statusBadgeVariant =
    status === 'PENDING' ? 'warning' :
    status === 'CONFIRMED' ? 'confirmed' :
    status === 'CHECKED_IN' ? 'brand' :
    status === 'COMPLETED' ? 'success' : 'danger';

  // Stepper state helper
  const isPendingDone = ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'].includes(status);
  const isConfirmedDone = ['CHECKED_IN', 'COMPLETED'].includes(status);
  const isCheckedInDone = status === 'COMPLETED';

  return (
    <div className="host-booking-detail">
      {/* ── Top Navigation Bar ── */}
      <div className="detail-top-nav">
        <Breadcrumb
          items={[
            { label: 'Host Portal', to: '/host/bookings' },
            { label: 'Quản lý đơn', to: '/host/bookings' },
            { label: `Chi tiết đơn #${bookingCode}` },
          ]}
        />
        <Link to="/host/bookings" className="back-link">
          <ChevronLeft /> Quay lại danh sách đơn
        </Link>
      </div>

      {/* ── Heading Header ── */}
      <div className="detail-header">
        <div className="detail-header-left">
          <h1 className="detail-code-title">Đơn #{bookingCode}</h1>
          <Badge variant={statusBadgeVariant} size="md">
            {BADGE_LABEL[status] || status}
          </Badge>
          {isDeposit30 && (
            <span style={{ fontSize: '0.78rem', color: '#c2410c', background: '#fff7ed', border: '1px solid #fed7aa', padding: '3px 9px', borderRadius: 8, fontWeight: 700 }}>
              Đã cọc 30%
            </span>
          )}
        </div>
        <div className="detail-created-at">
          <ClockHistory /> Ngày tạo: <strong>{booking.createdAt || '—'}</strong>
        </div>
      </div>

      {/* ── Lifecycle Stepper & Quick Action Banner ── */}
      <section className="action-banner">
        <div className="stepper-info">
          <div className="stepper-label">Quy trình xử lý đơn đặt phòng:</div>
          <div className="stepper-track">
            <span className={`step-pill ${status === 'PENDING' ? 'is-active' : isPendingDone ? 'is-done' : ''}`}>
              1. Chờ duyệt
            </span>
            <span className="step-arrow"><ArrowRight /></span>
            <span className={`step-pill ${status === 'CONFIRMED' ? 'is-active' : isConfirmedDone ? 'is-done' : ''}`}>
              2. Đã xác nhận
            </span>
            <span className="step-arrow"><ArrowRight /></span>
            <span className={`step-pill ${status === 'CHECKED_IN' ? 'is-active' : isCheckedInDone ? 'is-done' : ''}`}>
              3. Đang lưu trú
            </span>
            <span className="step-arrow"><ArrowRight /></span>
            <span className={`step-pill ${status === 'COMPLETED' ? 'is-done is-active' : ''}`}>
              4. Hoàn tất
            </span>
            {['CANCELLED', 'REJECTED'].includes(status) && (
              <>
                <span className="step-arrow"><ArrowRight /></span>
                <span className="step-pill" style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}>
                  Đã hủy / Từ chối
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-banner-buttons">
          {status === 'PENDING' && (
            <>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#059669', borderColor: '#059669', color: '#fff' }}
                disabled={isUpdating}
                onClick={() => handleStatusChange('CONFIRMED')}
              >
                <CheckLg /> Duyệt đơn đặt phòng
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
                disabled={isUpdating}
                onClick={() => handleStatusChange('REJECTED')}
              >
                <XCircle /> Từ chối yêu cầu
              </button>
            </>
          )}

          {status === 'CONFIRMED' && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ background: '#2563eb', borderColor: '#2563eb', color: '#fff' }}
              disabled={isUpdating}
              onClick={() => handleStatusChange('CHECKED_IN')}
            >
              <KeyFill /> Xác nhận khách đã Check-in
            </button>
          )}

          {status === 'CHECKED_IN' && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ background: '#059669', borderColor: '#059669', color: '#fff' }}
              disabled={isUpdating}
              onClick={() => handleStatusChange('COMPLETED')}
            >
              <Check2All /> Xác nhận hoàn tất &amp; Trả phòng
            </button>
          )}

          {status === 'COMPLETED' && (
            <Badge variant="success" size="md">
              <Check2All /> Đơn đã hoàn tất lưu trú · Doanh thu đã ghi nhận
            </Badge>
          )}
        </div>
      </section>

      {/* ── 2-Column Responsive Layout ── */}
      <div className="detail-grid">
        {/* Left Column (Main Details) */}
        <div className="detail-main-column">
          {/* Card 1: Chỗ ở & Thông tin kỳ nghỉ */}
          <div className="info-card">
            <h2 className="card-title">
              <div className="card-title-icon"><Building /></div>
              Thông tin Chỗ ở &amp; Hạng phòng
            </h2>

            {/* Property Snapshot */}
            <div className="property-snapshot">
              <img
                src={propertyImage}
                alt={booking.propertyName}
                className="property-thumb"
              />
              <div className="property-details">
                <h3>{booking.propertyName || 'Homestay ODauDay'}</h3>
                <span className="property-room-tag">
                  <DoorOpen style={{ marginRight: 4 }} />
                  {booking.roomName || 'Phòng tiêu chuẩn'}
                </span>
                <p className="property-address">
                  <GeoAltFill style={{ color: 'var(--color-primary, #ff385c)' }} />
                  {property?.address || 'Hà Nội, Việt Nam'}
                </p>
              </div>
            </div>

            {/* Stay Dates Box */}
            <div className="stay-dates-grid">
              <div className="date-box">
                <div className="date-box-header">Nhận phòng (Check-in)</div>
                <div className="date-box-date">{booking.checkIn}</div>
                <div className="date-box-time">Từ 14:00 chiều</div>
              </div>
              <div className="date-box">
                <div className="date-box-header">Trả phòng (Check-out)</div>
                <div className="date-box-date">{booking.checkOut}</div>
                <div className="date-box-time">Trước 12:00 trưa</div>
              </div>
            </div>

            {/* Quick Specs */}
            <div className="stay-quick-specs">
              <span>Thời gian lưu trú: <strong>{booking.nights} đêm</strong></span>
              <span>·</span>
              <span>Số lượng khách: <strong>{booking.guests} khách</strong></span>
              <span>·</span>
              <span>Bảo vệ: <ShieldCheck style={{ color: '#059669', verticalAlign: -1 }} /> <strong>ODauDay Cover</strong></span>
            </div>
          </div>

          {/* Card 2: Thông tin Khách đặt */}
          <div className="info-card">
            <h2 className="card-title">
              <div className="card-title-icon"><CalendarCheck /></div>
              Thông tin Khách thuê
            </h2>

            <div className="guest-profile-row">
              <div className="guest-avatar">
                {(booking.guestName || 'K').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="guest-name">{booking.guestName || 'Khách đặt'}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Khách hàng đã xác thực trên hệ thống
                </div>
              </div>
            </div>

            <div className="guest-contact-list">
              <div className="contact-item">
                <TelephoneFill className="contact-icon" />
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Số điện thoại</div>
                  <a href={`tel:${booking.guestPhone}`} className="contact-link">
                    {booking.guestPhone || 'Chưa cung cấp'}
                  </a>
                </div>
              </div>
              <div className="contact-item">
                <EnvelopeFill className="contact-icon" />
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Email liên hệ</div>
                  <a href={`mailto:${booking.guestEmail}`} className="contact-link">
                    {booking.guestEmail || 'Chưa cung cấp'}
                  </a>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.84rem', color: '#475569' }}>
              <strong>Phương thức thanh toán:</strong> {paymentLabel}
            </div>
          </div>
        </div>

        {/* Right Column (Billing & Financial Summary) */}
        <div className="detail-side-column">
          <div className="billing-card">
            <h2 className="card-title" style={{ marginBottom: '1rem' }}>
              <div className="card-title-icon"><CashCoin /></div>
              Chi tiết thanh toán
            </h2>

            <div className="billing-row">
              <span>Giá phòng ({booking.nights} đêm):</span>
              <strong>{formatVND(totalVal)}</strong>
            </div>
            <div className="billing-row">
              <span>Phí dịch vụ &amp; bảo hiểm:</span>
              <strong style={{ color: '#059669' }}>Miễn phí</strong>
            </div>

            <div className="billing-divider" />

            <div className="billing-row" style={{ fontSize: '1rem' }}>
              <span>Tổng giá trị đơn:</span>
              <strong style={{ fontSize: '1.2rem', color: '#0f172a' }}>{formatVND(totalVal)}</strong>
            </div>

            {isDeposit30 ? (
              <>
                <div className="billing-row success-row" style={{ marginTop: 4 }}>
                  <span>✓ Tiền đã cọc trước (30%):</span>
                  <strong>-{formatVND(paid)}</strong>
                </div>

                {/* Outstanding Collect Box */}
                <div className="collect-box">
                  <div className="collect-label">Cần thu khi nhận phòng (70%):</div>
                  <div className="collect-amount">{formatVND(remaining)}</div>
                  <p className="collect-note">
                    Chủ nhà trực tiếp thu khoản này từ khách (tiền mặt hoặc chuyển khoản tại quầy) khi làm thủ tục check-in.
                  </p>
                </div>
              </>
            ) : (
              <div className="paid-full-box">
                <div className="paid-full-label">✓ Đã thanh toán đủ (100%):</div>
                <div className="paid-full-amount">{formatVND(totalVal)}</div>
                <div style={{ fontSize: '0.76rem', color: '#065f46', marginTop: 4 }}>
                  Đơn đã được thanh toán toàn bộ qua cổng thanh toán trực tuyến.
                </div>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <Link to="/host/bookings" className="btn btn-outline btn-block" style={{ height: 42, borderRadius: 10, fontWeight: 600 }}>
                Quay lại danh sách đơn
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
