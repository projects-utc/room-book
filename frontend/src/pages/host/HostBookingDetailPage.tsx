// Host Booking Detail Page
import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { Breadcrumb } from '../../components/UI';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { formatVND, BADGE_CLASS, BADGE_LABEL, getBookingPaymentInfo } from '../../constants';
import {
  CalendarCheck,
  CheckLg,
  XCircle,
  KeyFill,
  Check2All,
  PersonCircle,
  ClockHistory,
} from 'react-bootstrap-icons';
import { BookingStatus } from '../../constants';
import type { Booking } from '../../data';
import stayApi from "../../api/stayApi";

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
    } catch (error) {
      console.error("Lỗi đổi trạng thái:", error);
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
    return <div role={loadError ? 'alert' : undefined} style={{ maxWidth: 1000, margin: '1.5rem auto', padding: '0 1rem' }}>
      <EmptyState compact title={notFound ? 'Không tìm thấy đơn đặt phòng' : 'Không tải được thông tin đơn'}
        description={notFound ? `Đơn #${bookingCode} không tồn tại hoặc đã bị xóa.` : loadError}
        action={<button type="button" className="btn btn-outline btn-sm"
          onClick={() => setReloadVersion(version => version + 1)}>Thử lại</button>}
        secondaryAction={<Link to="/host/bookings" className="btn btn-outline btn-sm">Quay lại danh sách đơn</Link>} />
    </div>;
  }

  const status = booking.status;
  const { isDeposit30, total: totalVal, paidAmount: paid, remainingAmount: remaining } = getBookingPaymentInfo(booking);
  const paymentLabel = isDeposit30
    ? 'Đặt cọc 30% (Chuyển khoản trực tuyến) · Thu 70% còn lại khi nhận phòng'
    : (booking.paymentMethod === 'BANK_TRANSFER' || (booking as any).payment_method === 'BANK_TRANSFER' ? 'Chuyển khoản ngân hàng (Đã thanh toán 100%)' : 'Thanh toán trực tiếp');

  return (
      <div style={{ maxWidth: 1000, margin: '1.5rem auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Breadcrumb
              items={[
                { label: 'Host Portal', to: '/host/properties' },
                { label: 'Quản lý đơn', to: '/host/bookings' },
                { label: `Chi tiết đơn #${bookingCode}` },
              ]}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              Đơn #{bookingCode}
            </h1>
            <span className={`badge ${BADGE_CLASS[status] || 'badge-pending'}`} style={{ fontSize: '0.9rem', padding: '0.4rem 0.9rem' }}>
            {BADGE_LABEL[status] || status}
          </span>
          </div>
          <span className="muted" style={{ fontSize: '0.85rem' }}>
          <ClockHistory /> Ngày tạo: {booking.createdAt || '—'}
        </span>
        </div>

        {/* State Transitions Toolbar */}
        <section className="panel" style={{ marginBottom: '1.5rem', background: 'var(--color-bg-app)', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>Thao tác chuyển trạng thái đơn:</strong>
              <span className="muted" style={{ fontSize: '0.82rem' }}>
              Quy trình: Chờ xác nhận → Đã xác nhận → Đang lưu trú → Đã hoàn thành
            </span>
            </div>

            <div className="btn-group" aria-busy={isUpdating}>
              {status === 'PENDING' && (
                  <>
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange('CONFIRMED')}
                    >
                      <CheckLg /> Duyệt đơn đặt phòng
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--color-danger)' }}
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
                      className="btn btn-primary btn-sm"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange('CHECKED_IN')}
                  >
                    <KeyFill /> Xác nhận khách đã check-in
                  </button>
              )}

              {status === 'CHECKED_IN' && (
                  <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange('COMPLETED')}
                  >
                    <Check2All /> Xác nhận hoàn tất &amp; Trả phòng
                  </button>
              )}

              {status === 'COMPLETED' && (
                  <span className="badge badge-completed" style={{ padding: '0.5rem 1rem' }}>
                <Check2All /> Đơn đã hoàn tất · Doanh thu đã ghi nhận
              </span>
              )}
            </div>
          </div>
        </section>

        <div className="layout-side">
          {/* Left Column: Stay Info */}
          <section className="panel">
            <h2 style={{ fontSize: '1.2rem', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarCheck className="text-brand" /> Thông tin lưu trú chi tiết
            </h2>

            <table style={{ width: '100%' }}>
              <tbody>
              <tr>
                <th style={{ width: '38%', padding: '0.75rem', borderBottom: '1px solid var(--line)' }}>Cơ sở lưu trú</th>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--line)' }}>
                  <strong>{booking.propertyName || 'Chưa có thông tin'}</strong>
                </td>
              </tr>
              <tr>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--line)' }}>Hạng phòng</th>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--line)' }}>
                  {booking.roomName || 'Chưa có thông tin'}
                </td>
              </tr>
              <tr>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--line)' }}>Thời gian kỳ nghỉ</th>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--line)' }}>
                  {booking?.checkIn} (14:00) → {booking?.checkOut} (12:00) · <strong>{booking?.nights} đêm</strong>
                </td>
              </tr>
              <tr>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--line)' }}>Số lượng khách</th>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--line)' }}>
                  {booking?.guests} khách
                </td>
              </tr>
              <tr>
                <th style={{ padding: '0.75rem' }}>Phương thức thanh toán</th>
                <td style={{ padding: '0.75rem' }}>{paymentLabel}</td>
              </tr>
              </tbody>
            </table>
          </section>

          {/* Right Column: Guest Profile & Snapshot */}
          <aside>
            <div className="panel" style={{ boxShadow: 'var(--shadow-md)', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', marginTop: 0, marginBottom: '1rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem' }}>
                <PersonCircle className="text-brand" /> Thông tin khách đặt
              </h3>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '1.05rem' }}>
                {booking?.guestName}
              </p>
              <p className="muted" style={{ margin: '0 0 0.35rem', fontSize: '0.9rem' }}>
                Số điện thoại: <strong>{booking?.guestPhone}</strong>
              </p>
              <p className="muted" style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>
                Email: <strong>{booking?.guestEmail}</strong>
              </p>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '0.75rem' }}>
                {isDeposit30 ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                      <span>Tổng giá trị đơn:</span>
                      <strong>{formatVND(totalVal)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#059669', marginBottom: 8 }}>
                      <span>✓ Đã cọc trước (30%):</span>
                      <strong>-{formatVND(paid)}</strong>
                    </div>
                    <div style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 10, padding: '0.65rem 0.85rem' }}>
                      <span style={{ fontSize: '0.74rem', color: '#C2410C', fontWeight: 800, textTransform: 'uppercase', display: 'block' }}>
                        Cần thu khi nhận phòng (70%):
                      </span>
                      <strong style={{ fontSize: '1.35rem', color: '#EA580C', fontWeight: 800, display: 'block', marginTop: 2 }}>
                        {formatVND(remaining)}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="muted" style={{ fontSize: '0.82rem' }}>
                      Tổng tiền thanh toán (100%):
                    </span>
                    <p className="card-price" style={{ fontSize: '1.5rem', margin: '0.25rem 0 0' }}>
                      {formatVND(totalVal)}
                    </p>
                    <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                      ✓ Đã thanh toán toàn bộ qua ngân hàng
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Link to="/host/bookings" className="btn btn-outline btn-block">
              Quay lại danh sách đơn
            </Link>
          </aside>
        </div>
      </div>
  );
}
