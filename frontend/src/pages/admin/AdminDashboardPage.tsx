// Admin Dashboard: System Overview & Business Analytics (TypeScript)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { stayApi } from '../../api/stayApi';
import { ODDStore } from '../../store';
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

  useEffect(() => {
    stayApi.getState().then(res => {
      if (res.success && res.data) {
        ODDStore.syncFromBackend();
      }
    });
  }, []);
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
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: 20,
          padding: '2rem 2.25rem',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 56, 92, 0.2)', border: '1px solid rgba(255, 56, 92, 0.4)', borderRadius: 9999, padding: '0.2rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, color: '#FECDD3', marginBottom: '0.65rem' }}>
            <ShieldCheck /> TRUNG TÂM ĐIỀU HÀNH &amp; GIÁM SÁT TOÀN SÀN
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.4rem', letterSpacing: '-0.02em', color: '#FFF' }}>
            Chào mừng trở lại, Quản trị viên! 🌿
          </h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.92rem', maxWidth: 650, lineHeight: 1.5 }}>
            Toàn bộ các chỉ số kinh doanh, giao dịch đặt phòng và hoạt động của người dùng đang được cập nhật liên tục theo thời gian thực.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/client" style={{ textDecoration: 'none' }}>
            <Button variant="outline" size="sm" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#FFFFFF', background: 'rgba(255,255,255,0.06)' }}>
              <Globe /> Xem trang Khách
            </Button>
          </Link>
          <Link to="/admin/promotions" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm" style={{ background: 'linear-gradient(135deg, #FF385C 0%, #E00B41 100%)' }}>
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
                <span style={{ color: '#0F172A' }}>Hoàn tất kỳ lưu trú (COMPLETED)</span>
                <span style={{ color: '#10B981' }}>{completedBookings.length} đơn ({bookings.length ? Math.round((completedBookings.length / bookings.length) * 100) : 0}%)</span>
              </div>
              <div style={{ height: 8, background: '#F1F5F9', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${bookings.length ? (completedBookings.length / bookings.length) * 100 : 0}%`, background: '#10B981', borderRadius: 9999 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                <span style={{ color: '#0F172A' }}>Đã xác nhận &amp; Đang ở (CONFIRMED / CHECKED_IN)</span>
                <span style={{ color: '#0284C7' }}>{confirmedBookings.length} đơn</span>
              </div>
              <div style={{ height: 8, background: '#F1F5F9', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${bookings.length ? (confirmedBookings.length / bookings.length) * 100 : 0}%`, background: '#0284C7', borderRadius: 9999 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                <span style={{ color: '#0F172A' }}>Chờ chủ nhà duyệt (PENDING)</span>
                <span style={{ color: '#D97706' }}>{pendingBookings.length} đơn</span>
              </div>
              <div style={{ height: 8, background: '#F1F5F9', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${bookings.length ? (pendingBookings.length / bookings.length) * 100 : 0}%`, background: '#F59E0B', borderRadius: 9999 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                <span style={{ color: '#0F172A' }}>Đã hủy (CANCELLED)</span>
                <span style={{ color: '#64748B' }}>{cancelledBookings.length} đơn</span>
              </div>
              <div style={{ height: 8, background: '#F1F5F9', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${bookings.length ? (cancelledBookings.length / bookings.length) * 100 : 0}%`, background: '#94A3B8', borderRadius: 9999 }} />
              </div>
            </div>

            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
              <Link to="/admin/bookings" style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FF385C', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                textDecoration: 'none',
                color: '#0F172A',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#E0E7FF', color: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                <PeopleFill />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Người dùng &amp; RBAC</div>
              <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Khóa/mở khóa &amp; phân quyền</div>
            </Link>

            <Link
              to="/admin/properties"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                padding: '1rem',
                borderRadius: 12,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                textDecoration: 'none',
                color: '#0F172A',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                <Building />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Chỗ ở &amp; Phòng</div>
              <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Duyệt danh sách &amp; bảng giá</div>
            </Link>

            <Link
              to="/admin/promotions"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                padding: '1rem',
                borderRadius: 12,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                textDecoration: 'none',
                color: '#0F172A',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#FFE4E6', color: '#E11D48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                <TicketPerforatedFill />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Mã giảm giá</div>
              <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{activePromoCount} mã đang kích hoạt</div>
            </Link>

            <Link
              to="/admin/audit-logs"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                padding: '1rem',
                borderRadius: 12,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                textDecoration: 'none',
                color: '#0F172A',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                <ClockHistory />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Nhật ký kiểm toán</div>
              <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Lịch sử thao tác an toàn</div>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Bookings Table */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>
              Đơn đặt phòng mới nhất cần theo dõi
            </span>
            <Link to="/admin/bookings" style={{ fontSize: '0.82rem', color: '#FF385C', fontWeight: 700, textDecoration: 'none' }}>
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
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>{b.code}</span>
                </TableCell>
                <TableCell>
                  <div style={{ fontWeight: 600 }}>{b.guestName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{b.guestPhone}</div>
                </TableCell>
                <TableCell>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>{b.propertyName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{b.roomName}</div>
                </TableCell>
                <TableCell>
                  <div style={{ fontSize: '0.85rem' }}>{b.checkIn} → {b.checkOut}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{b.nights} đêm · {b.guests} khách</div>
                </TableCell>
                <TableCell>
                  <span style={{ fontWeight: 700, color: '#FF385C' }}>{formatVND(b.total)}</span>
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
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>
              Nhật ký kiểm toán &amp; can thiệp hệ thống (UC-10 / Audit Log)
            </span>
            <Link to="/admin/audit-logs" style={{ fontSize: '0.82rem', color: '#FF385C', fontWeight: 700, textDecoration: 'none' }}>
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
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
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
                        ? '#FEE2E2'
                        : log.action === 'CHANGE_ROLE'
                        ? '#E0E7FF'
                        : log.action === 'CREATE_PROMO'
                        ? '#FFE4E6'
                        : '#DCFCE7',
                    color:
                      log.action === 'LOCK'
                        ? '#B91C1C'
                        : log.action === 'CHANGE_ROLE'
                        ? '#4338CA'
                        : log.action === 'CREATE_PROMO'
                        ? '#BE123C'
                        : '#15803D',
                  }}
                >
                  {log.action}
                </span>
                <div>
                  <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>{log.target}</span>: {log.details}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#64748B' }}>
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

