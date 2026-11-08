// Admin Audit Logs Page: System Audit Trail & Compliance (TypeScript)
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
  InputField,
  SelectField,
  EmptyState,
} from '../../components';
import {
  JournalText,
  Search,
  ShieldCheck,
  LockFill,
  UnlockFill,
  PersonCheckFill,
  XCircleFill,
  Building,
  TicketPerforatedFill,
} from 'react-bootstrap-icons';
import { AuditLog } from '../../data';

export default function AdminAuditLogsPage() {
  const { store } = useStore();

  const [logs, setLogs] = useState<AuditLog[]>(() => store.getAuditLogs());
  const [kw, setKw] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filtered = logs.filter((l) => {
    const kwLower = kw.toLowerCase().trim();
    const matchKw =
      !kwLower ||
      l.target.toLowerCase().includes(kwLower) ||
      l.details.toLowerCase().includes(kwLower) ||
      l.performedBy.toLowerCase().includes(kwLower);

    const matchAction = actionFilter === 'ALL' || l.action === actionFilter;
    return matchKw && matchAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOCK':
        return <Badge variant="danger">Khóa tài khoản</Badge>;
      case 'UNLOCK':
        return <Badge variant="success">Mở khóa</Badge>;
      case 'CHANGE_ROLE':
        return <Badge variant="info">Đổi vai trò</Badge>;
      case 'CANCEL_BOOKING':
        return <Badge variant="danger">Hủy đơn can thiệp</Badge>;
      case 'TOGGLE_PROPERTY':
        return <Badge variant="warning">Khóa/Mở chỗ ở</Badge>;
      case 'CREATE_PROMO':
        return <Badge variant="success">Tạo Voucher</Badge>;
      case 'DELETE_PROMO':
        return <Badge variant="neutral">Xóa Voucher</Badge>;
      default:
        return <Badge variant="neutral">{action}</Badge>;
    }
  };

  const lockCount = logs.filter((l) => l.action === 'LOCK' || l.action === 'UNLOCK').length;
  const roleCount = logs.filter((l) => l.action === 'CHANGE_ROLE').length;
  const promoCount = logs.filter((l) => l.action.includes('PROMO')).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.35rem', color: 'var(--color-text-primary)' }}>
          Nhật ký Kiểm toán &amp; Giám sát Hệ thống (UC-10 / Audit Trail)
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
          Lưu trữ toàn bộ các thao tác nhạy cảm, quyền hạn quản trị và can thiệp nghiệp vụ để đảm bảo tính minh bạch, tuân thủ an toàn dữ liệu.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          label="Tổng bản ghi kiểm toán"
          value={`${logs.length} sự kiện`}
          description="Được ghi nhận tự động vào cơ sở dữ liệu"
          variant="highlight"
        />
        <StatCard
          label="Thao tác Tài khoản"
          value={`${lockCount} lần`}
          description="Khóa hoặc mở khóa người dùng"
          trendDirection="neutral"
        />
        <StatCard
          label="Phân quyền &amp; Đổi Role"
          value={`${roleCount} lần`}
          description="Chuyển quyền Admin / Host / Guest"
          trendDirection="up"
        />
        <StatCard
          label="Chiến dịch Khuyến mại"
          value={`${promoCount} lần`}
          description="Phát hành và cập nhật mã giảm giá"
          trendDirection="up"
        />
      </div>

      {/* Main Table Card */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>
              Danh sách sự kiện kiểm toán ({filtered.length} kết quả)
            </span>
          </div>
        }
      >
        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <InputField
            placeholder="Tìm theo người thực hiện, đối tượng hoặc nội dung chi tiết..."
            value={kw}
            onChange={(e) => setKw(e.target.value)}
          />

          <SelectField
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'Tất cả hành động' },
              { value: 'LOCK', label: 'Khóa tài khoản' },
              { value: 'UNLOCK', label: 'Mở khóa tài khoản' },
              { value: 'CHANGE_ROLE', label: 'Đổi vai trò RBAC' },
              { value: 'CANCEL_BOOKING', label: 'Can thiệp hủy đơn' },
              { value: 'TOGGLE_PROPERTY', label: 'Khóa/Mở chỗ ở' },
              { value: 'CREATE_PROMO', label: 'Tạo mã giảm giá' },
            ]}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="Không tìm thấy bản ghi kiểm toán nào"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc hành động."
          />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>MÃ SỰ KIỆN</TableHeaderCell>
                <TableHeaderCell>THỜI GIAN</TableHeaderCell>
                <TableHeaderCell>HÀNH ĐỘNG</TableHeaderCell>
                <TableHeaderCell>NGƯỜI THỰC HIỆN</TableHeaderCell>
                <TableHeaderCell>ĐỐI TƯỢNG TÁC ĐỘNG</TableHeaderCell>
                <TableHeaderCell>CHI TIẾT NỘI DUNG</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      #AUD-{log.id}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{log.timestamp}</div>
                  </TableCell>

                  <TableCell>{getActionBadge(log.action)}</TableCell>

                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }} />
                      <span>{log.performedBy}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                      {log.target}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>{log.details}</span>
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

