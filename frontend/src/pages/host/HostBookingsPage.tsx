// UC-08: Host Bookings Management Page (Standardized Components)
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import {
  Breadcrumb,
  Button,
  Card,
  StatCard,
  Tabs,
  Badge,
} from '../../components';
import { formatVND, BADGE_CLASS, BADGE_LABEL } from '../../constants';
import {
  CalendarCheck,
  CheckLg,
  XCircle,
  Eye,
  KeyFill,
  Check2All,
} from 'react-bootstrap-icons';
import { Booking } from '../../data';

export default function HostBookingsPage() {
  const { store, addToast } = useStore();

  const [bookings, setBookings] = useState<Booking[]>(() => store.getAllBookings());
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED'>('ALL');

  const refreshList = () => {
    setBookings(store.getAllBookings());
  };

  const handleUpdateStatus = (code: string, newStatus: Booking['status']) => {
    const res = store.updateBookingStatus(code, newStatus);
    if (res.success) {
      addToast(`Đã chuyển trạng thái đơn #${code} sang ${newStatus}`, 'success');
      refreshList();
    } else {
      addToast(res.message || 'Lỗi khi cập nhật trạng thái', 'error');
    }
  };

  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
  const confirmedCount = bookings.filter(b => b.status === 'CONFIRMED').length;
  const completedCount = bookings.filter(b => b.status === 'COMPLETED').length;

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'ALL') return true;
    return b.status === activeTab;
  });

  return (
    <div style={{ maxWidth: 1200, margin: '1.5rem auto', padding: '0 1rem' }}>
      <Breadcrumb
        items={[
          { label: 'Host Portal', to: '/host/properties' },
          { label: 'Quản lý đơn đặt phòng' },
        ]}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.35rem', color: '#222222' }}>
            Quản lý &amp; Xử lý đơn đặt phòng
          </h1>
          <p style={{ margin: 0, color: '#717171', fontSize: '0.95rem' }}>
            Danh sách các yêu cầu lưu trú của khách thuộc các chỗ ở của chủ nhà (Tài khoản: <strong>host.demo</strong>).
          </p>
        </div>
        <Badge variant="active">Tự động đồng bộ Realtime</Badge>
      </div>

      {/* KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <StatCard
          label="Yêu cầu chờ phê duyệt"
          value={`${pendingCount} đơn`}
          sublabel="Cần phản hồi trong 24h"
          accent="warn"
        />
        <StatCard
          label="Đơn đã xác nhận (Sắp tới)"
          value={`${confirmedCount} đơn`}
          sublabel="Chờ đón khách nhận phòng"
          accent="brand"
        />
        <StatCard
          label="Đơn lưu trú hoàn tất"
          value={`${completedCount} đơn`}
          sublabel="Đã ghi nhận doanh thu (BR-08)"
          accent="ok"
        />
      </div>

      {/* Bookings Card Container */}
      <Card
        variant="default"
        padding="none"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarCheck style={{ color: '#FF385C', fontSize: '1.2rem' }} />
            <span>Danh sách đơn đặt phòng ({filteredBookings.length})</span>
          </div>
        }
      >
        <div style={{ padding: '1rem 1.25rem 0.5rem', borderBottom: '1px solid #EBEBEB' }}>
          <Tabs
            variant="pills"
            activeId={activeTab}
            onChange={id => setActiveTab(id as any)}
            items={[
              { id: 'ALL', label: 'Tất cả đơn', count: bookings.length },
              { id: 'PENDING', label: 'Chờ duyệt', count: pendingCount },
              { id: 'CONFIRMED', label: 'Đã xác nhận', count: confirmedCount },
              { id: 'COMPLETED', label: 'Hoàn tất', count: completedCount },
            ]}
          />
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.85rem 1rem' }}>Mã đơn</th>
                <th style={{ padding: '0.85rem 1rem' }}>Khách đặt</th>
                <th style={{ padding: '0.85rem 1rem' }}>Hạng phòng & Chỗ ở</th>
                <th style={{ padding: '0.85rem 1rem' }}>Thời gian lưu trú</th>
                <th style={{ padding: '0.85rem 1rem' }}>Tổng tiền</th>
                <th style={{ padding: '0.85rem 1rem' }}>Trạng thái</th>
                <th style={{ textAlign: 'right', padding: '0.85rem 1rem' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(b => (
                <tr key={b.code}>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: '#222222' }}>
                    #{b.code}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <strong style={{ display: 'block', color: '#222222' }}>{b.guestName}</strong>
                    <span style={{ fontSize: '0.78rem', color: '#717171' }}>
                      {b.guestPhone}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <strong style={{ display: 'block', color: '#222222' }}>{b.roomName}</strong>
                    <span style={{ fontSize: '0.78rem', color: '#717171' }}>
                      {b.propertyName}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.88rem' }}>
                    {b.checkIn} → {b.checkOut}
                    <span style={{ display: 'block', fontSize: '0.78rem', color: '#717171' }}>
                      {b.nights} đêm · {b.guests} khách
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#FF385C' }}>
                    {formatVND(b.total)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`badge ${BADGE_CLASS[b.status] || 'badge-pending'}`}>
                      {BADGE_LABEL[b.status] || b.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {b.status === 'PENDING' && (
                        <>
                          <Button
                            variant="primary"
                            size="xs"
                            icon={<CheckLg />}
                            onClick={() => handleUpdateStatus(b.code, 'CONFIRMED')}
                          >
                            Duyệt đơn
                          </Button>
                          <Button
                            variant="danger"
                            size="xs"
                            icon={<XCircle />}
                            onClick={() => handleUpdateStatus(b.code, 'REJECTED')}
                          >
                            Từ chối
                          </Button>
                        </>
                      )}

                      {b.status === 'CONFIRMED' && (
                        <Button
                          variant="outline"
                          size="xs"
                          icon={<KeyFill />}
                          onClick={() => handleUpdateStatus(b.code, 'CHECKED_IN')}
                        >
                          Check-in
                        </Button>
                      )}

                      {b.status === 'CHECKED_IN' && (
                        <Button
                          variant="primary"
                          size="xs"
                          icon={<Check2All />}
                          onClick={() => handleUpdateStatus(b.code, 'COMPLETED')}
                        >
                          Hoàn tất
                        </Button>
                      )}

                      <Link to={`/host/bookings/${b.code}`}>
                        <Button variant="outline" size="xs" icon={<Eye />}>
                          Chi tiết
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
