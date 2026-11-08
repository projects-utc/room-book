// UC-08: Host Bookings Management Page (Standardized Components)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { stayApi } from '../../api/stayApi'; // Nhớ import stayApi
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

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED'>('ALL');

  // HÀM TẢI DỮ LIỆU TỪ BACKEND
  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const response = await stayApi.getBookings(); // Lấy dữ liệu từ MySQL
      if (response.success && response.data) {
        setBookings(response.data);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách đơn:", error);
      addToast('Lỗi khi tải danh sách đơn từ máy chủ', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // TỰ ĐỘNG GỌI API KHI VÀO TRANG
  useEffect(() => {
    fetchBookings();
  }, []);

  // HÀM ĐỔI TRẠNG THÁI (GỌI API XUỐNG BACKEND)
  const handleUpdateStatus = async (code: string, newStatus: Booking['status']) => {
    try {
      const response = await stayApi.updateBookingStatus(code, newStatus);
      if (response.success) {
        addToast(`Đã chuyển trạng thái đơn #${code} sang ${newStatus}`, 'success');

        // Cập nhật lại state trên giao diện ngay lập tức mà không cần load lại trang
        setBookings(prev => prev.map(b => b.code === code ? { ...b, status: newStatus } : b));

        // Đồng bộ vào local store
        store.updateBookingStatus(code, newStatus);
      } else {
        addToast(response.message || 'Lỗi khi cập nhật trạng thái từ máy chủ', 'error');
      }
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      addToast('Không thể kết nối đến máy chủ để đổi trạng thái', 'error');
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
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.35rem', color: 'var(--color-text-primary)' }}>
              Quản lý &amp; Xử lý đơn đặt phòng
            </h1>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
              Danh sách các yêu cầu lưu trú của khách thuộc các chỗ ở của chủ nhà (Tài khoản: <strong>host.demo</strong>).
            </p>
          </div>
          <Badge variant="active">Đã kết nối Database</Badge>
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
                <CalendarCheck style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }} />
                <span>Danh sách đơn đặt phòng ({filteredBookings.length})</span>
              </div>
            }
        >
          <div style={{ padding: '1rem 1.25rem 0.5rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
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
              {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                      Đang tải dữ liệu từ máy chủ...
                    </td>
                  </tr>
              ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                      Không có đơn đặt phòng nào trong mục này.
                    </td>
                  </tr>
              ) : (
                  filteredBookings.map(b => (
                      <tr key={b.code}>
                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          #{b.code}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <strong style={{ display: 'block', color: 'var(--color-text-primary)' }}>{b.guestName}</strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                        {b.guestPhone}
                      </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <strong style={{ display: 'block', color: 'var(--color-text-primary)' }}>{b.roomName}</strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                        {b.propertyName}
                      </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.88rem' }}>
                          {b.checkIn} → {b.checkOut}
                          <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                        {b.nights} đêm · {b.guests} khách
                      </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
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
                  ))
              )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
  );
}