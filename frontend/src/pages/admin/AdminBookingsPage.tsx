// Admin Bookings Page: Platform-wide Booking Oversight & Intervention (TypeScript)
import React, { useState } from 'react';
import { useStore } from '../../contexts/StoreContext';
import {
  Card,
  StatCard,
  Badge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Button,
  InputField,
  SelectField,
  Modal,
  EmptyState,
} from '../../components';
import {
  CalendarCheck,
  Search,
  ExclamationOctagonFill,
  CheckCircleFill,
  ClockHistory,
  EyeFill,
  XCircleFill,
  ArrowRightShort,
  CashStack,
} from 'react-bootstrap-icons';
import { Booking } from '../../data';
import { formatVND } from '../../constants';

export default function AdminBookingsPage() {
  const { store, addToast } = useStore();

  const [bookings, setBookings] = useState<Booking[]>(() => store.getAllBookings());
  const [kw, setKw] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Cancel Modal
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('Tranh chấp hoặc khiếu nại được Admin giải quyết');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const refreshList = () => {
    setBookings(store.getAllBookings());
  };

  const filtered = bookings.filter((b) => {
    const kwLower = kw.toLowerCase().trim();
    const matchKw =
      !kwLower ||
      b.code.toLowerCase().includes(kwLower) ||
      b.guestName.toLowerCase().includes(kwLower) ||
      b.guestPhone.includes(kwLower) ||
      b.propertyName.toLowerCase().includes(kwLower) ||
      b.roomName.toLowerCase().includes(kwLower);

    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchKw && matchStatus;
  });

  const handleOpenDetail = (b: Booking) => {
    setSelectedBooking(b);
    setShowDetailModal(true);
  };

  const handleOpenCancel = (b: Booking) => {
    setBookingToCancel(b);
    setCancelReason('Tranh chấp hoặc khiếu nại được Admin giải quyết');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    if (!bookingToCancel) return;
    const res = store.adminCancelBooking(bookingToCancel.code, cancelReason);
    if (res.success) {
      addToast(`Đã hủy đơn ${bookingToCancel.code} do can thiệp của Quản trị viên.`, 'success');
      setShowCancelModal(false);
      refreshList();
    } else {
      addToast(res.message || 'Lỗi khi hủy đơn', 'error');
    }
  };

  const handleChangeStatus = (code: string, newStatus: Booking['status']) => {
    const res = store.updateBookingStatus(code, newStatus);
    if (res.success) {
      addToast(`Đã chuyển trạng thái đơn ${code} sang ${newStatus}`, 'info');
      refreshList();
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Hoàn thành</Badge>;
      case 'CONFIRMED':
        return <Badge variant="info">Đã duyệt</Badge>;
      case 'CHECKED_IN':
        return <Badge variant="warning">Đang lưu trú</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Chờ duyệt</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral">Đã hủy</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Đã từ chối</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;
  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;
  const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED').length;
  const totalValue = bookings.reduce((sum, b) => sum + b.total, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.35rem', color: '#0F172A' }}>
          Quản lý Toàn bộ Đơn đặt phòng (UC-03 / UC-08 / Bookings)
        </h1>
        <p style={{ margin: 0, color: '#64748B', fontSize: '0.92rem' }}>
          Theo dõi vòng đời kỳ nghỉ, kiểm soát dòng tiền giao dịch và xử lý các tranh chấp, khiếu nại phát sinh giữa khách và chủ nhà.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          label="Tổng đơn đặt phát sinh"
          value={`${bookings.length} đơn`}
          description="Toàn bộ lịch sử trên hệ thống"
          variant="highlight"
        />
        <StatCard
          label="Đơn đã hoàn tất"
          value={`${completedCount} đơn`}
          description="Kỳ lưu trú kết thúc thành công"
          trend="Đã thu phí sàn"
          trendDirection="up"
        />
        <StatCard
          label="Đơn đang chờ duyệt"
          value={`${pendingCount} đơn`}
          description="Cần chủ nhà xác nhận trước hạn"
          trendDirection="neutral"
        />
        <StatCard
          label="Tổng giá trị đơn đặt"
          value={formatVND(totalValue)}
          description="Bao gồm đơn hoàn thành &amp; đang xử lý"
          trendDirection="up"
        />
      </div>

      {/* Main Table Card */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>
              Danh sách đơn đặt phòng ({filtered.length} đơn)
            </span>
          </div>
        }
      >
        {/* Search & Filter Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <InputField
            placeholder="Tìm theo mã đơn (ODD-...), tên khách, số điện thoại, chỗ ở..."
            value={kw}
            onChange={(e) => setKw(e.target.value)}
          />

          <SelectField
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'PENDING', label: 'Chờ duyệt (PENDING)' },
              { value: 'CONFIRMED', label: 'Đã xác nhận (CONFIRMED)' },
              { value: 'CHECKED_IN', label: 'Đang lưu trú (CHECKED_IN)' },
              { value: 'COMPLETED', label: 'Hoàn thành (COMPLETED)' },
              { value: 'CANCELLED', label: 'Đã hủy (CANCELLED)' },
            ]}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="Không tìm thấy đơn đặt phòng nào"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn lọc trạng thái khác."
          />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>MÃ ĐƠN</TableHeaderCell>
                <TableHeaderCell>KHÁCH HÀNG</TableHeaderCell>
                <TableHeaderCell>CHỖ Ở &amp; PHÒNG</TableHeaderCell>
                <TableHeaderCell>KỲ LƯU TRÚ</TableHeaderCell>
                <TableHeaderCell>TỔNG TIỀN</TableHeaderCell>
                <TableHeaderCell>TRẠNG THÁI</TableHeaderCell>
                <TableHeaderCell align="right">THAO TÁC CAN THIỆP</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((b) => (
                <TableRow key={b.code}>
                  <TableCell>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>
                      {b.code}
                    </span>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Tạo: {b.createdAt}</div>
                  </TableCell>

                  <TableCell>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{b.guestName}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      {b.guestPhone} · {b.guestEmail}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{b.propertyName}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{b.roomName}</div>
                  </TableCell>

                  <TableCell>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{b.checkIn} → {b.checkOut}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {b.nights} đêm · {b.guests} khách
                    </div>
                  </TableCell>

                  <TableCell>
                    <div style={{ fontWeight: 800, color: '#FF385C', fontSize: '0.95rem' }}>
                      {formatVND(b.total)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      Đơn giá: {formatVND(b.pricePerNight)}/đêm
                    </div>
                  </TableCell>

                  <TableCell>{statusBadge(b.status)}</TableCell>

                  <TableCell align="right">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenDetail(b)}
                        title="Xem chi tiết"
                      >
                        <EyeFill /> Chi tiết
                      </Button>

                      {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenCancel(b)}
                          style={{ color: '#B91C1C', borderColor: '#FECACA' }}
                          title="Hủy đơn can thiệp"
                        >
                          <XCircleFill /> Hủy đơn
                        </Button>
                      )}

                      {/* Status Override Shortcut */}
                      <select
                        value={b.status}
                        onChange={(e) => handleChangeStatus(b.code, e.target.value as any)}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: 6,
                          border: '1px solid #CBD5E1',
                          padding: '0.2rem 0.4rem',
                          background: '#FFFFFF',
                          color: '#334155',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="CHECKED_IN">CHECKED_IN</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal: Booking Detail */}
      {showDetailModal && selectedBooking && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Chi tiết đơn đặt phòng: ${selectedBooking.code}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header pill */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>MÃ ĐƠN</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{selectedBooking.code}</div>
              </div>
              <div>{statusBadge(selectedBooking.status)}</div>
            </div>

            {/* Information Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.88rem' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>KHÁCH HÀNG</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '0.2rem' }}>{selectedBooking.guestName}</div>
                <div style={{ color: '#475569' }}>SĐT: {selectedBooking.guestPhone}</div>
                <div style={{ color: '#475569' }}>Email: {selectedBooking.guestEmail}</div>
                <div style={{ color: '#94A3B8', fontSize: '0.78rem' }}>Tài khoản: {selectedBooking.guestUsername}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>CHỖ NGHỈ &amp; PHÒNG</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '0.2rem' }}>{selectedBooking.propertyName}</div>
                <div style={{ color: '#475569' }}>Phòng: {selectedBooking.roomName}</div>
                <div style={{ color: '#475569' }}>Số khách: {selectedBooking.guests} người</div>
              </div>
            </div>

            {/* Dates & Billing */}
            <div style={{ background: '#FFF1F2', border: '1px solid #FFE4E6', borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: '#64748B' }}>Lịch nhận - trả phòng:</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{selectedBooking.checkIn} đến {selectedBooking.checkOut} ({selectedBooking.nights} đêm)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: '#64748B' }}>Đơn giá phòng / đêm:</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{formatVND(selectedBooking.pricePerNight)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: '#64748B' }}>Tiền phòng (Subtotal):</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{formatVND(selectedBooking.subtotal)}</span>
              </div>
              <div style={{ height: 1, background: '#FECDD3', margin: '0.25rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800 }}>
                <span style={{ color: '#E11D48' }}>Tổng cộng thanh toán:</span>
                <span style={{ color: '#E11D48' }}>{formatVND(selectedBooking.total)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Admin Cancel Intervention */}
      {showCancelModal && bookingToCancel && (
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title={`Can thiệp hủy đơn: ${bookingToCancel.code}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '0.85rem 1rem', borderRadius: 10, color: '#991B1B', fontSize: '0.88rem', lineHeight: 1.45 }}>
              <strong>Lưu ý:</strong> Thao tác này sẽ hủy đơn ngay lập tức, giải phóng phòng và được ghi lại trong <strong>Nhật ký kiểm toán hệ thống (Audit Log)</strong>.
            </div>

            <InputField
              label="Lý do Admin can thiệp hủy đơn"
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do khiếu nại, tranh chấp hoặc thỏa thuận hoàn tiền..."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
                Quay lại
              </Button>
              <Button variant="danger" onClick={handleConfirmCancel}>
                Xác nhận hủy đơn
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

