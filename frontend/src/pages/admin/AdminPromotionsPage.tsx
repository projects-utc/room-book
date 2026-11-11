// Admin Promotions Page: Voucher & Marketing Campaign Management (TypeScript)
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
  TicketPerforatedFill,
  PlusCircle,
  Search,
  CheckCircleFill,
  XCircleFill,
  Trash3,
  CalendarCheck,
  TagFill,
} from 'react-bootstrap-icons';
import { Promotion } from '../../data';
import { formatVND } from '../../constants';

export default function AdminPromotionsPage() {
  const { store, addToast } = useStore();

  const [promotions, setPromotions] = useState<Promotion[]>(() => store.getPromotions());
  const [kw, setKw] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Promotion Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [value, setValue] = useState(15);
  const [maxDiscount, setMaxDiscount] = useState(250000);
  const [minOrder, setMinOrder] = useState(500000);
  const [usageLimit, setUsageLimit] = useState(100);
  const [validTo, setValidTo] = useState('2027-12-31');

  const refreshList = () => {
    setPromotions(store.getPromotions());
  };

  const filtered = promotions.filter((p) => {
    const matchKw = !kw || p.code.toLowerCase().includes(kw.toLowerCase().trim());
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchKw && matchStatus;
  });

  const handleToggleStatus = (p: Promotion) => {
    const res = store.togglePromotion(p.id);
    if (res.success) {
      addToast(
        `Đã chuyển trạng thái mã ${p.code} sang ${res.newStatus === 'ACTIVE' ? 'KÍCH HOẠT' : 'TẠM DỪNG'}`,
        'success'
      );
      refreshList();
    }
  };

  const handleDelete = (p: Promotion) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa mã giảm giá "${p.code}" không?`)) {
      store.deletePromotion(p.id);
      addToast(`Đã xóa mã giảm giá "${p.code}" thành công!`, 'info');
      refreshList();
    }
  };

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    const res = store.addPromotion({
      code,
      type,
      value: Number(value),
      maxDiscount: type === 'PERCENT' ? Number(maxDiscount) : undefined,
      minOrder: Number(minOrder),
      usageLimit: Number(usageLimit),
      validTo,
    });

    if (res.success) {
      addToast(`Đã tạo mã giảm giá ${code.toUpperCase()} thành công!`, 'success');
      setShowAddModal(false);
      setCode('');
      refreshList();
    } else {
      addToast(res.message || 'Lỗi khi tạo mã giảm giá', 'error');
    }
  };

  const activeCount = promotions.filter((p) => p.status === 'ACTIVE').length;
  const totalUsages = promotions.reduce((sum, p) => sum + (p.usedCount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.35rem', color: 'var(--color-text-primary)' }}>
            Quản lý Mã giảm giá &amp; Voucher Khuyến mại
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
            Tạo lập các chiến dịch kích cầu du lịch, phân bổ ngân sách giảm giá và kiểm soát lượt sử dụng đồng thời.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          style={{ background: 'var(--gradient-primary)' }}
        >
          <PlusCircle /> Tạo mã giảm giá mới
        </Button>
      </div>

      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          label="Tổng chiến dịch mã"
          value={`${promotions.length} mã`}
          description="Được phát hành trên toàn hệ thống"
          variant="highlight"
        />
        <StatCard
          label="Đang kích hoạt"
          value={`${activeCount} mã`}
          description="Khách hàng có thể nhập tại trang thanh toán"
          trend="Đang áp dụng"
          trendDirection="up"
        />
        <StatCard
          label="Tổng lượt đã sử dụng"
          value={`${totalUsages} lượt`}
          description="Được áp dụng thành công vào đơn phòng"
          trendDirection="up"
        />
        <StatCard
          label="Tỷ lệ lấp đầy ngân sách"
          value="45.8%"
          description="Kiểm soát an toàn giới hạn chiết khấu"
          trendDirection="neutral"
        />
      </div>

      {/* Main Table Card */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>
              Danh sách mã giảm giá ({filtered.length} kết quả)
            </span>
          </div>
        }
      >
        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <InputField
            placeholder="Tìm theo mã code (VD: ODAUDAY10, CHAOHE2027)..."
            value={kw}
            onChange={(e) => setKw(e.target.value)}
          />

          <SelectField
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'ACTIVE', label: 'Đang kích hoạt (ACTIVE)' },
              { value: 'INACTIVE', label: 'Tạm dừng (INACTIVE)' },
            ]}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="Không tìm thấy mã giảm giá nào"
            description="Hãy thử nhập mã code khác hoặc tạo mới mã giảm giá đầu tiên."
          />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>MÃ VOUCHER</TableHeaderCell>
                <TableHeaderCell>LOẠI GIẢM</TableHeaderCell>
                <TableHeaderCell>MỨC GIẢM</TableHeaderCell>
                <TableHeaderCell>ĐƠN TỐI THIỂU</TableHeaderCell>
                <TableHeaderCell>TIẾN ĐỘ SỬ DỤNG</TableHeaderCell>
                <TableHeaderCell>HẠN SỬ DỤNG</TableHeaderCell>
                <TableHeaderCell>TRẠNG THÁI</TableHeaderCell>
                <TableHeaderCell align="right">THAO TÁC</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p) => {
                const percentUsed = Math.min(100, Math.round(((p.usedCount || 0) / (p.usageLimit || 1)) * 100));
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)', border: '1px dashed var(--color-primary-border)', padding: '0.25rem 0.65rem', borderRadius: 8, fontFamily: 'monospace', fontWeight: 800, fontSize: '0.92rem' }}>
                          {p.code}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                        {p.hostUsername ? `Riêng chủ nhà: ${p.hostUsername}` : 'Toàn hệ thống ODauDay'}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                        {p.type === 'PERCENT' ? 'Theo tỷ lệ (%)' : 'Số tiền cố định'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                        {p.type === 'PERCENT' ? `${p.value}%` : formatVND(p.value)}
                      </div>
                      {p.maxDiscount && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Tối đa: {formatVND(p.maxDiscount)}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatVND(p.minOrder)}</span>
                    </TableCell>

                    <TableCell>
                      <div style={{ width: 140 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                          <span>{p.usedCount} / {p.usageLimit}</span>
                          <span style={{ fontWeight: 700 }}>{percentUsed}%</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--color-bg-muted)', borderRadius: 9999, overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${percentUsed}%`,
                              background: percentUsed >= 90 ? 'var(--color-danger)' : 'var(--color-success)',
                              borderRadius: 9999,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div style={{ fontSize: '0.85rem' }}>Đến: {p.validTo}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Từ: {p.validFrom}</div>
                    </TableCell>

                    <TableCell>
                      {p.status === 'ACTIVE' ? (
                        <Badge variant="success">Kích hoạt</Badge>
                      ) : (
                        <Badge variant="neutral">Tạm dừng</Badge>
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleToggleStatus(p)}
                          style={{
                            color: p.status === 'ACTIVE' ? 'var(--color-warning)' : 'var(--color-success)',
                            borderColor: p.status === 'ACTIVE' ? 'var(--color-warning-border)' : 'var(--color-success-border)',
                          }}
                        >
                          {p.status === 'ACTIVE' ? 'Tạm dừng' : 'Bật lại'}
                        </Button>

                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleDelete(p)}
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          <Trash3 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal: Create Promotion */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Tạo mới mã giảm giá (Promotion)"
          size="md"
        >
          <form onSubmit={handleCreatePromo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <InputField
              label="Mã giảm giá (Code)"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VD: HE2027, CHAOHE15"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <SelectField
                label="Loại chiết khấu"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                options={[
                  { value: 'PERCENT', label: 'Theo phần trăm (%)' },
                  { value: 'FIXED', label: 'Số tiền cố định (VNĐ)' },
                ]}
              />

              <InputField
                label={type === 'PERCENT' ? 'Tỷ lệ giảm (%)' : 'Số tiền giảm (VNĐ)'}
                type="number"
                required
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                placeholder={type === 'PERCENT' ? '10' : '100000'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              {type === 'PERCENT' ? (
                <InputField
                  label="Giảm tối đa (VNĐ)"
                  type="number"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(Number(e.target.value))}
                  placeholder="200000"
                />
              ) : (
                <div />
              )}

              <InputField
                label="Đơn tối thiểu áp dụng (VNĐ)"
                type="number"
                value={minOrder}
                onChange={(e) => setMinOrder(Number(e.target.value))}
                placeholder="500000"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <InputField
                label="Giới hạn số lượt dùng"
                type="number"
                required
                value={usageLimit}
                onChange={(e) => setUsageLimit(Number(e.target.value))}
                placeholder="100"
              />

              <InputField
                label="Hạn sử dụng đến ngày"
                type="date"
                required
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
              <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>
                Hủy bỏ
              </Button>
              <Button variant="primary" type="submit" style={{ background: 'var(--gradient-primary)' }}>
                Xác nhận tạo mã
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

