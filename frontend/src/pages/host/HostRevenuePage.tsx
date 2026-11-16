// UC-09: Host Revenue & Reports Page (Standardized Components)
import React from 'react';
import { useStore } from '../../contexts/StoreContext';
import {
  Breadcrumb,
  Card,
  StatCard,
  Badge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  EmptyState,
} from '../../components';
import { formatVND } from '../../constants';
import {
  GraphUpArrow,
  CheckCircle,
  DoorClosed,
  CashStack,
  ExclamationCircle,
} from 'react-bootstrap-icons';

export default function HostRevenuePage() {
  const { store, currentUser } = useStore();
  const owner = currentUser?.username || 'host.demo';

  const revData = store.getRevenueData(owner);
  const completedBookings = revData.completedBookings;
  const cancelledBookings = revData.cancelledBookings;
  const pendingBookings = revData.pendingBookings;

  return (
    <div style={{ maxWidth: 1240, margin: '2rem auto', padding: '0 1.5rem' }}>
      <Breadcrumb
        items={[
          { label: 'Host Portal', to: '/host/properties' },
          { label: 'Báo cáo doanh thu tài chính' },
        ]}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', margin: '1rem 0 2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.35rem', color: 'var(--color-text-primary)' }}>
            Báo cáo doanh thu &amp; Thống kê lưu trú
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            Doanh thu được tổng hợp từ các đơn đặt phòng đã hoàn tất kỳ lưu trú thực tế.
          </p>
        </div>
      </div>

      {/* Standard KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard
          label="Doanh thu thực nhận"
          value={formatVND(revData.totalRevenue)}
          sublabel="Phí nền tảng 0đ · Thực nhận 100%"
          accent="brand"
          icon={<CashStack />}
        />
        <StatCard
          label="Đơn lưu trú thành công"
          value={`${completedBookings.length} đơn`}
          sublabel="Khách đã hoàn tất trả phòng (Check-out)"
          accent="ok"
          icon={<CheckCircle />}
        />
        <StatCard
          label="Đơn chưa tính doanh thu"
          value={`${cancelledBookings.length + pendingBookings.length} đơn`}
          sublabel="Bao gồm đơn đã hủy & đơn chờ xác nhận"
          accent="warn"
          icon={<ExclamationCircle />}
        />
      </div>

      {/* Completed Bookings Revenue Table Card */}
      <Card
        title="Danh sách đơn đã ghi nhận doanh thu"
        headerRight={
          <Badge variant="success" dot icon={<DoorClosed />}>
            COMPLETED
          </Badge>
        }
      >
        {completedBookings.length === 0 ? (
          <EmptyState
            compact
            icon={<GraphUpArrow />}
            title="Chưa có đơn nào hoàn tất"
            description="Chưa có đơn nào ở trạng thái COMPLETED trong kỳ báo cáo này."
          />
        ) : (
          <Table hover>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Mã đơn</TableHeaderCell>
                <TableHeaderCell>Khách lưu trú</TableHeaderCell>
                <TableHeaderCell>Cơ sở &amp; Phòng</TableHeaderCell>
                <TableHeaderCell>Khoảng ngày ở</TableHeaderCell>
                <TableHeaderCell>Doanh thu ghi nhận</TableHeaderCell>
                <TableHeaderCell align="right">Trạng thái</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {completedBookings.map(b => (
                <TableRow key={b.code}>
                  <TableCell>
                    <code style={{ background: 'var(--color-bg-muted)', padding: '2px 6px', borderRadius: 4, fontSize: '0.88rem' }}>
                      {b.code}
                    </code>
                  </TableCell>
                  <TableCell bold>{b.guestName}</TableCell>
                  <TableCell>
                    {b.propertyName} · <span style={{ color: 'var(--color-text-muted)' }}>{b.roomName}</span>
                  </TableCell>
                  <TableCell>
                    {b.checkIn} → {b.checkOut} ({b.nights} đêm)
                  </TableCell>
                  <TableCell bold style={{ color: 'var(--airbnb-pink)' }}>
                    {formatVND(b.total)}
                  </TableCell>
                  <TableCell align="right">
                    <Badge variant="completed" dot>
                      COMPLETED
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
