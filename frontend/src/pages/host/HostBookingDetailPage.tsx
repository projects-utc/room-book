// UC-08: Host Booking Detail Page (TypeScript)
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { UCTag, Breadcrumb, Badge } from '../../components/UI';
import { formatVND, BADGE_CLASS, BADGE_LABEL } from '../../constants';
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

export default function HostBookingDetailPage() {
  const { code } = useParams<{ code: string }>();
  const { store, addToast } = useStore();

  const bookingCode = code || 'ODD-DEMO-0002';
  const booking = store.getBooking(bookingCode) || store.getAllBookings()[0];

  const [status, setStatus] = useState<BookingStatus>(booking?.status || 'PENDING');

  const handleStatusChange = (newStatus: BookingStatus) => {
    const res = store.updateBookingStatus(bookingCode, newStatus);
    if (res.success) {
      setStatus(newStatus);
      addToast(`Đã chuyển trạng thái đơn #${bookingCode} sang ${newStatus}`, 'success');
    } else {
      addToast(res.message || 'Lỗi khi cập nhật trạng thái', 'error');
    }
  };

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
          <UCTag>
            <CalendarCheck /> Chi tiết đơn đặt phòng
          </UCTag>
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
          <ClockHistory /> Ngày tạo: {booking?.createdAt || '02/01/2027'}
        </span>
        </div>

        {/* State Transitions Toolbar */}
        <section className="panel" style={{ marginBottom: '1.5rem', background: '#f8fafc', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>Thao tác chuyển trạng thái đơn:</strong>
              <span className="muted" style={{ fontSize: '0.82rem' }}>
              Quy trình: Chờ xác nhận → Đã xác nhận → Đang lưu trú → Đã hoàn thành
            </span>
            </div>

            <div className="btn-group">
              {status === 'PENDING' && (
                  <>
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleStatusChange('CONFIRMED')}
                    >
                      <CheckLg /> Duyệt đơn đặt phòng
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ color: '#dc2626' }}
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
                      onClick={() => handleStatusChange('CHECKED_IN')}
                  >
                    <KeyFill /> Xác nhận khách đã check-in
                  </button>
              )}

              {status === 'CHECKED_IN' && (
                  <button
                      type="button"
                      className="btn btn-primary btn-sm"
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
                  <strong>{booking?.propertyName || 'ODauDay Stay Hồ Tây'}</strong>
                </td>
              </tr>
              <tr>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--line)' }}>Hạng phòng</th>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--line)' }}>
                  {booking?.roomName || 'Phòng Garden'}
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
                <td style={{ padding: '0.75rem' }}>Thu trực tiếp khi nhận phòng (COD)</td>
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
              <span className="muted" style={{ fontSize: '0.82rem' }}>
                Tổng tiền thanh toán:
              </span>
                <p className="card-price" style={{ fontSize: '1.5rem', margin: '0.25rem 0 0' }}>
                  {formatVND(booking?.total || 1300000)}
                </p>
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