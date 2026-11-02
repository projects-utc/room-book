// UC-09: Host Revenue & Reports Page (Standardized Components)
import React, { useState } from 'react';
import { useStore } from '../../contexts/StoreContext';
import {
  Breadcrumb,
  Button,
  Card,
  InputField,
  SelectField,
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
  FileEarmarkSpreadsheet,
  CheckCircle,
  DoorClosed,
  Filter,
  CashStack,
  ExclamationCircle,
} from 'react-bootstrap-icons';

export default function HostRevenuePage() {
  const { store, currentUser, addToast } = useStore();
  const owner = currentUser?.username || 'host.demo';

  const [fromMonth, setFromMonth] = useState('2026-12');
  const [toMonth, setToMonth] = useState('2027-02');
  const [propertyFilter, setPropertyFilter] = useState('Tất cả cơ sở');

  const revData = store.getRevenueData(owner);
  const completedBookings = revData.completedBookings;
  const cancelledBookings = revData.cancelledBookings;
  const pendingBookings = revData.pendingBookings;

  const handleExportCSV = () => {
    addToast('Đã xuất báo cáo doanh thu tài chính định dạng CSV/Excel!', 'success');
  };

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
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.35rem', color: '#1E293B' }}>
            Báo cáo doanh thu &amp; Thống kê lưu trú
          </h1>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.95rem' }}>
            Dòng tiền chỉ được tổng hợp từ các đơn đặt phòng đã hoàn tất kỳ lưu trú thực tế (<code>COMPLETED</code>) theo quy tắc kế toán BR-08.
          </p>
        </div>
        <Button variant="outline" icon={<FileEarmarkSpreadsheet />} onClick={handleExportCSV}>
          Xuất file Excel / CSV
        </Button>
      </div>

      {/* Filter Controls Card */}
      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <InputField
            id="rev-from"
            type="month"
            label="Từ kỳ tháng"
            value={fromMonth}
            onChange={e => setFromMonth(e.target.value)}
          />
          <InputField
            id="rev-to"
            type="month"
            label="Đến kỳ tháng"
            value={toMonth}
            onChange={e => setToMonth(e.target.value)}
          />
          <SelectField
            id="rev-prop"
            label="Cơ sở kinh doanh"
            value={propertyFilter}
            onChange={e => setPropertyFilter(e.target.value)}
            options={[
              { value: 'Tất cả cơ sở', label: 'Tất cả cơ sở sở hữu' },
              { value: 'ODauDay Stay Hồ Tây', label: 'ODauDay Stay Hồ Tây' },
              { value: 'ODauDay Stay Ba Vì', label: 'ODauDay Stay Ba Vì' },
            ]}
          />
          <div>
            <Button
              variant="primary"
              icon={<Filter />}
              block
              onClick={() => addToast('Đã áp dụng bộ lọc kỳ báo cáo doanh thu', 'info')}
            >
              Lọc dữ liệu báo cáo
            </Button>
          </div>
        </div>
      </Card>

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
          label="Đơn loại trừ không tính (TC-14)"
          value={`${cancelledBookings.length + pendingBookings.length} đơn`}
          sublabel="Bao gồm đơn đã hủy & đơn chờ duyệt"
          accent="warn"
          icon={<ExclamationCircle />}
        />
      </div>

      {/* Completed Bookings Revenue Table Card */}
      <Card
        title="Chi tiết danh sách đơn được ghi nhận vào doanh thu (BR-08)"
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
                    <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, fontSize: '0.88rem' }}>
                      {b.code}
                    </code>
                  </TableCell>
                  <TableCell bold>{b.guestName}</TableCell>
                  <TableCell>
                    {b.propertyName} · <span style={{ color: '#64748B' }}>{b.roomName}</span>
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
