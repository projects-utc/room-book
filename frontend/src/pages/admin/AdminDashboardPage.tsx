// Admin Dashboard: System Overview & Business Analytics (TypeScript)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
} from '../../components';
import {
  CurrencyDollar,
  CalendarCheck,
  Building,
  PeopleFill,
  ArrowUpRight,
  ShieldCheck,
  TicketPerforatedFill,
  ClockHistory,
  EyeFill,
  ExclamationOctagonFill,
  CheckCircleFill,
  HouseDoorFill,
  Globe,
} from 'react-bootstrap-icons';
import { formatVND } from '../../constants';

export default function AdminDashboardPage() {
  const { store, dataVersion } = useStore();
  const users = store.getAllUsers();
  const properties = store.getAllProperties();
  const rooms = store.getAllRooms();
  const bookings = store.getAllBookings();
  const promotions = store.getPromotions();
  const auditLogs = store.getAuditLogs();

  // Metrics
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');
  const pendingBookings = bookings.filter((b) => b.status === 'PENDING');
  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED');
  const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED');

  const totalRevenue = completedBookings.reduce((sum, b) => sum + b.total, 0);
  const hostCount = users.filter((u) => u.role === 'HOST').length;
  const guestCount = users.filter((u) => u.role === 'GUEST').length;
  const activePromoCount = promotions.filter((p) => p.status === 'ACTIVE').length;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Hoàn thành</Badge>;
      case 'CONFIRMED':
        return <Badge variant="info">Đã xác nhận</Badge>;
      case 'CHECKED_IN':
        return <Badge variant="warning">Đang lưu trú</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Chờ duyệt</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral">Đã hủy</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-text-primary) 100%)',
          borderRadius: 20,
          padding: '2rem 2.25rem',
          color: 'var(--color-bg-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 56, 92, 0.2)', border: '1px solid rgba(255, 56, 92, 0.4)', borderRadius: 9999, padding: '0.2rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary-border)', marginBottom: '0.65rem' }}>
            <ShieldCheck /> TRUNG TÂM ĐIỀU HÀNH &amp; GIÁM SÁT TOÀN SÀN
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.4rem', letterSpacing: '-0.02em', color: 'var(--color-bg-surface)' }}>
            Chào mừng trở lại, Quản trị viên! 🌿
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.92rem', maxWidth: 650, lineHeight: 1.5 }}>
            Toàn bộ các chỉ số kinh doanh, giao dịch đặt phòng và hoạt động của người dùng đang được cập nhật liên tục theo thời gian thực.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/client" style={{ textDecoration: 'none' }}>
            <Button variant="outline" size="sm" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'var(--color-bg-surface)', background: 'rgba(255,255,255,0.06)' }}>
              <Globe /> Xem trang Khách
            </Button>
          </Link>
          <Link to="/admin/promotions" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm" style={{ background: 'var(--gradient-primary)' }}>
              <TicketPerforatedFill /> Tạo mã giảm giá
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          label="Tổng doanh thu sàn"
          value={formatVND(totalRevenue)}
          description="Từ các kỳ nghỉ đã hoàn thành"
          trend="+18.4% tháng này"
          trendDirection="up"
          variant="highlight"
        />

        <StatCard
          label="Tổng đơn đặt phòng"
          value={`${bookings.length} đơn`}
          description={`${pendingBookings.length} đơn đang chờ duyệt`}
          trend={`${completedBookings.length} đã hoàn thành`}
          trendDirection="up"
        />

        <StatCard
          label="Cơ sở lưu trú & Phòng"
          value={`${properties.length} chỗ ở`}
          description={`Quy mô ${rooms.length} phòng cho thuê`}
          trend="100% hoạt động"
          trendDirection="neutral"
        />

        <StatCard
          label="Người dùng hệ thống"
          value={`${users.length} tài khoản`}
          description={`${hostCount} Chủ nhà · ${guestCount} Khách`}
          trend="Độ tin cậy 99.8%"
          trendDirection="up"
        />
      </div>

      {/* Middle Grid: Booking Lifecycle Progress & Quick Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Booking Distribution */}
        <Card title="Tiến trình & Vòng đời Đơn đặt phòng (UC-03 / UC-08)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                <span style={{ color: 'var(--color-text-primary)' }}>Hoàn tất kỳ lưu trú (COMPLETED)</span>
                <span style={{ color: 'var(--color-success)' }}>{completedBookings.length} đơn ({bookings.length ? Math.round((completedBookings.length / bookings.length) * 100) : 0}%)</span>
              </div>
              <div style={{ height: 8, background: 'var(--color-bg-muted)', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${bookings.length ? (completedBookings.length / bookings.length) * 100 : 0}%`, background: 'var(--color-success)', borderRadius: 9999 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                <span style={{ color: 'var(--color-text-primary)' }}>Đã xác nhận &amp; Đang ở (CONFIRMED / CHECKED_IN)</span>
                <span style={{ color: 'var(--color-info)' }}>{confirmedBookings.length} đơn</span>
              </div>
              <div style={{ height: 8, background: 'var(--color-bg-muted)', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${bookings.length ? (confirmedBookings.length / bookings.length) * 100 : 0}%`, background: 'var(--color-info)', borderRadius: 9999 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                <span style={{ color: 'var(--color-text-primary)' }}>Chờ chủ nhà duyệt (PENDING)</span>
                <span style={{ color: 'var(--color-warning)' }}>{pendingBookings.length} đơn</span>
              </div>
              <div style={{ height: 8, background: 'var(--color-bg-muted)', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${bookings.length ? (pendingBookings.length / bookings.length) * 100 : 0}%`, background: 'var(--color-warning)', borderRadius: 9999 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                <span style={{ color: 'var(--color-text-primary)' }}>Đã hủy (CANCELLED)</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{cancelledBookings.length} đơn</span>
              </div>
              <div style={{ height: 8, background: 'var(--color-bg-muted)', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${bookings.length ? (cancelledBookings.length / bookings.length) * 100 : 0}%`, background: 'var(--color-text-muted)', borderRadius: 9999 }} />
              </div>
            </div>

            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--color-bg-muted)', display: 'flex', justifyContent: 'flex-end' }}>
              <Link to="/admin/bookings" style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>Quản lý toàn bộ đơn đặt</span>
                <ArrowUpRight />
              </Link>
            </div>
          </div>
        </Card>

        {/* Quick Management Navigation */}
        <Card title="Phím tắt điều hướng quản trị">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <Link
              to="/admin/users"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                padding: '1rem',
                borderRadius: 12,
                background: 'var(--color-bg-app)',
                border: '1px solid var(--color-border-subtle)',
                textDecoration: 'none',
                color: 'var(--color-text-primary)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--color-info-bg)', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                <PeopleFill />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Người dùng &amp; RBAC</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Khóa/mở khóa &amp; phân quyền</div>
            </Link>

            <Link
              to="/admin/properties"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                padding: '1rem',
                borderRadius: 12,
                background: 'var(--color-bg-app)',
                border: '1px solid var(--color-border-subtle)',
                textDecoration: 'none',
                color: 'var(--color-text-primary)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--color-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                <Building />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Chỗ ở &amp; Phòng</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Duyệt danh sách &amp; bảng giá</div>
            </Link>

            <Link
              to="/admin/promotions"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                padding: '1rem',
                borderRadius: 12,
                background: 'var(--color-bg-app)',
                border: '1px solid var(--color-border-subtle)',
                textDecoration: 'none',
                color: 'var(--color-text-primary)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--color-primary-border)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                <TicketPerforatedFill />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Mã giảm giá</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{activePromoCount} mã đang kích hoạt</div>
            </Link>

            <Link
              to="/admin/audit-logs"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                padding: '1rem',
                borderRadius: 12,
                background: 'var(--color-bg-app)',
                border: '1px solid var(--color-border-subtle)',
                textDecoration: 'none',
                color: 'var(--color-text-primary)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--color-bg-muted)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                <ClockHistory />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Nhật ký kiểm toán</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Lịch sử thao tác an toàn</div>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Bookings Table */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>
              Đơn đặt phòng mới nhất cần theo dõi
            </span>
            <Link to="/admin/bookings" style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
              Xem tất cả ({bookings.length}) →
            </Link>
          </div>
        }
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>MÃ ĐƠN</TableHeaderCell>
              <TableHeaderCell>KHÁCH HÀNG</TableHeaderCell>
              <TableHeaderCell>CHỖ Ở &amp; PHÒNG</TableHeaderCell>
              <TableHeaderCell>KỲ LƯU TRÚ</TableHeaderCell>
              <TableHeaderCell>TỔNG TIỀN</TableHeaderCell>
              <TableHeaderCell>TRẠNG THÁI</TableHeaderCell>
              <TableHeaderCell align="right">THAO TÁC</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.slice(0, 5).map((b) => (
              <TableRow key={b.code}>
                <TableCell>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-text-primary)' }}>{b.code}</span>
                </TableCell>
                <TableCell>
                  <div style={{ fontWeight: 600 }}>{b.guestName}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{b.guestPhone}</div>
                </TableCell>
                <TableCell>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{b.propertyName}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{b.roomName}</div>
                </TableCell>
                <TableCell>
                  <div style={{ fontSize: '0.85rem' }}>{b.checkIn} → {b.checkOut}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{b.nights} đêm · {b.guests} khách</div>
                </TableCell>
                <TableCell>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatVND(b.total)}</span>
                </TableCell>
                <TableCell>{statusBadge(b.status)}</TableCell>
                <TableCell align="right">
                  <Link to="/admin/bookings" style={{ textDecoration: 'none' }}>
                    <Button variant="outline" size="xs">
                      Chi tiết
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Recent System Audit Feed */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>
              Nhật ký kiểm toán &amp; can thiệp hệ thống (UC-10 / Audit Log)
            </span>
            <Link to="/admin/audit-logs" style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
              Xem toàn bộ log →
            </Link>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {auditLogs.slice(0, 4).map((log) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: 10,
                background: 'var(--color-bg-app)',
                border: '1px solid var(--color-border-subtle)',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    padding: '0.25rem 0.55rem',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background:
                      log.action === 'LOCK'
                        ? 'var(--color-danger-bg)'
                        : log.action === 'CHANGE_ROLE'
                        ? 'var(--color-info-bg)'
                        : log.action === 'CREATE_PROMO'
                        ? 'var(--color-primary-border)'
                        : 'var(--color-success-bg)',
                    color:
                      log.action === 'LOCK'
                        ? 'var(--color-danger)'
                        : log.action === 'CHANGE_ROLE'
                        ? 'var(--color-secondary)'
                        : log.action === 'CREATE_PROMO'
                        ? 'var(--color-danger)'
                        : 'var(--color-success)',
                  }}
                >
                  {log.action}
                </span>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.88rem' }}>{log.target}</span>: {log.details}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                <span>Bởi: <strong>{log.performedBy}</strong></span>
                <span>·</span>
                <span>{log.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

