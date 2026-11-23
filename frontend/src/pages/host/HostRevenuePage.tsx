// Host Revenue & Reports Page
import React, { useEffect, useState } from 'react';
import { useStore } from '../../contexts/StoreContext';
import { stayApi, RevenueSummary } from '../../api/stayApi';
import {
  Breadcrumb,
  Card,
  StatCard,
  Badge,
  Alert,
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
  Percent,
  Wallet2,
} from 'react-bootstrap-icons';

const EMPTY_SUMMARY: RevenueSummary = {
  totalBookings: 0,
  totalRevenue: 0,
  platformFeeRate: 0.15,
  platformFee: 0,
  netRevenue: 0,
  count: 0,
  completedBookings: [],
  cancelledBookings: [],
  pendingBookings: [],
};

export default function HostRevenuePage() {
  const { currentUser } = useStore();
  const owner = currentUser?.username || 'host.demo';

  const [revData, setRevData] = useState<RevenueSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    stayApi.getRevenueSummary(owner).then(res => {
      if (!active) return;
      if (res.success && res.data) {
        setRevData(res.data);
      } else {
        setError(res.message || 'Không thể tải báo cáo doanh thu từ máy chủ.');
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [owner]);

  const completedBookings = revData.completedBookings || [];
  const cancelledBookings = revData.cancelledBookings || [];
  const pendingBookings = revData.pendingBookings || [];
  const feePercent = Math.round((revData.platformFeeRate ?? 0.15) * 100);
  const netPercent = 100 - feePercent;

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
            Doanh thu được tổng hợp trực tiếp từ cơ sở dữ liệu theo các đơn đặt phòng đã hoàn tất kỳ lưu trú thực tế.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert type="error" title="Không tải được dữ liệu doanh thu">
            {error}
          </Alert>
        </div>
      )}

      {/* Standard KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard
          label="Doanh thu gộp"
          value={loading ? '...' : formatVND(revData.totalRevenue)}
          sublabel="Tổng giá trị các đơn đã hoàn tất"
          accent="brand"
          icon={<CashStack />}
        />
        <StatCard
          label="Phí nền tảng phải trả"
          value={loading ? '...' : formatVND(revData.platformFee)}
          sublabel={`Mức phí ${feePercent}% trên doanh thu gộp`}
          accent="warn"
          icon={<Percent />}
        />
        <StatCard
          label="Doanh thu thực nhận"
          value={loading ? '...' : formatVND(revData.netRevenue)}
          sublabel={`Thực nhận ${netPercent}% sau khi trừ phí nền tảng`}
          accent="ok"
          icon={<Wallet2 />}
        />
        <StatCard
          label="Đơn lưu trú thành công"
          value={loading ? '...' : `${completedBookings.length} đơn`}
          sublabel={`Chưa tính doanh thu: ${cancelledBookings.length + pendingBookings.length} đơn (hủy & chờ duyệt)`}
          accent="info"
          icon={<CheckCircle />}
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
