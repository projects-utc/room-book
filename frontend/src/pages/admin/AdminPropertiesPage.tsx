// Admin Properties Page: Property & Homestay Management (TypeScript)
import React, { useState, useEffect } from 'react';
import { useStore } from '../../contexts/StoreContext';
import { stayApi } from '../../api/stayApi';
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
  Building,
  Search,
  LockFill,
  UnlockFill,
  EyeFill,
  StarFill,
  HouseDoorFill,
  Trash3,
  CheckCircleFill,
  ExclamationOctagonFill,
} from 'react-bootstrap-icons';
import { Property, Room } from '../../data';
import { formatVND } from '../../constants';

export default function AdminPropertiesPage() {
  const { store, addToast } = useStore();

  const [properties, setProperties] = useState<Property[]>(() => store.getAllProperties());
  const [kw, setKw] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal Room details state
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);
  const [propRooms, setPropRooms] = useState<Room[]>([]);
  const [showRoomModal, setShowRoomModal] = useState(false);

  const refreshList = () => {
    stayApi.getProperties().then(res => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setProperties(res.data);
      } else {
        setProperties(store.getAllProperties());
      }
    });
  };

  useEffect(() => {
    refreshList();
  }, []);

  const cities = ['ALL', ...Array.from(new Set(properties.map((p) => p.city).filter(Boolean)))];

  const filtered = properties.filter((p) => {
    const kwLower = kw.toLowerCase().trim();
    const matchKw =
      !kwLower ||
      p.name.toLowerCase().includes(kwLower) ||
      p.address.toLowerCase().includes(kwLower) ||
      p.owner.toLowerCase().includes(kwLower);

    const matchCity = cityFilter === 'ALL' || p.city === cityFilter;
    const propStatus = p.status || 'ACTIVE';
    const matchStatus = statusFilter === 'ALL' || propStatus === statusFilter;

    return matchKw && matchCity && matchStatus;
  });

  const handleToggleStatus = (p: Property) => {
    const res = store.togglePropertyStatus(p.id);
    if (res.success) {
      addToast(
        `Đã chuyển trạng thái cơ sở "${p.name}" sang ${res.newStatus === 'LOCKED' ? 'TẠM KHÓA' : 'HOẠT ĐỘNG'}`,
        'success'
      );
      refreshList();
    }
  };

  const handleOpenRooms = (p: Property) => {
    setSelectedProp(p);
    const rooms = store.getRoomsByProperty(p.id);
    setPropRooms(rooms);
    setShowRoomModal(true);
  };

  const handleDelete = (p: Property) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa cơ sở lưu trú "${p.name}" không?`)) {
      store.deleteProperty(p.id);
      addToast(`Đã xóa cơ sở lưu trú "${p.name}" thành công!`, 'info');
      refreshList();
    }
  };

  const activeCount = properties.filter((p) => (p.status || 'ACTIVE') === 'ACTIVE').length;
  const lockedCount = properties.filter((p) => p.status === 'LOCKED').length;
  const totalRooms = store.getAllRooms().length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.35rem', color: 'var(--color-text-primary)' }}>
          Quản lý Chỗ ở &amp; Homestay toàn sàn (UC-06 / Properties)
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
          Kiểm duyệt, quản lý hiển thị, giá niêm yết và trạng thái hoạt động của toàn bộ cơ sở lưu trú trên nền tảng.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          label="Tổng cơ sở lưu trú"
          value={`${properties.length} chỗ ở`}
          description="Được đăng tải bởi các đối tác chủ nhà"
          variant="highlight"
        />
        <StatCard
          label="Đang mở đón khách"
          value={`${activeCount} chỗ ở`}
          description="Hiển thị công khai trên trang tìm kiếm"
          trend="Sẵn sàng đặt phòng"
          trendDirection="up"
        />
        <StatCard
          label="Đang tạm khóa / Kiểm duyệt"
          value={`${lockedCount} cơ sở`}
          description="Đang ẩn khỏi danh sách tìm kiếm"
          trendDirection="neutral"
        />
        <StatCard
          label="Tổng số phòng quản lý"
          value={`${totalRooms} phòng`}
          description="Trung bình ~2-4 phòng / cơ sở"
          trendDirection="up"
        />
      </div>

      {/* Main Table Card */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>
              Danh sách cơ sở lưu trú ({filtered.length} kết quả)
            </span>
          </div>
        }
      >
        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <InputField
            placeholder="Tìm theo tên chỗ ở, địa chỉ hoặc chủ sở hữu..."
            value={kw}
            onChange={(e) => setKw(e.target.value)}
          />

          <SelectField
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            options={cities.map((c) => ({
              value: c,
              label: c === 'ALL' ? 'Tất cả thành phố' : c,
            }))}
          />

          <SelectField
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'ACTIVE', label: 'Đang hoạt động' },
              { value: 'LOCKED', label: 'Đang tạm khóa' },
            ]}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="Không tìm thấy cơ sở lưu trú nào"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc địa điểm/trạng thái."
          />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>ẢNH &amp; TÊN CHỖ Ở</TableHeaderCell>
                <TableHeaderCell>LOẠI HÌNH</TableHeaderCell>
                <TableHeaderCell>CHỦ NHÀ (HOST)</TableHeaderCell>
                <TableHeaderCell>VỊ TRÍ</TableHeaderCell>
                <TableHeaderCell>GIÁ TỪ</TableHeaderCell>
                <TableHeaderCell>ĐÁNH GIÁ</TableHeaderCell>
                <TableHeaderCell>TRẠNG THÁI</TableHeaderCell>
                <TableHeaderCell align="right">THAO TÁC</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p) => {
                const isLocked = p.status === 'LOCKED';
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={p.image}
                          alt={p.name}
                          style={{
                            width: 52,
                            height: 44,
                            borderRadius: 8,
                            objectFit: 'cover',
                            border: '1px solid var(--color-border-subtle)',
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.92rem' }}>{p.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                            {p.badge && <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>[{p.badge}] </span>}
                            ID: #{p.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{p.type}</span>
                    </TableCell>

                    <TableCell>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.88rem' }}>{p.owner}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Chủ cơ sở</div>
                    </TableCell>

                    <TableCell>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{p.city}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.address}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatVND(p.priceMin)}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}> /đêm</span>
                    </TableCell>

                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-text-primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                        <StarFill style={{ color: 'var(--color-warning)', fontSize: '0.8rem' }} />
                        <span>{p.rating}</span>
                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>({p.reviewsCount})</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {isLocked ? (
                        <Badge variant="danger">Tạm khóa</Badge>
                      ) : (
                        <Badge variant="success">Hoạt động</Badge>
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenRooms(p)}
                          title="Xem danh sách phòng"
                        >
                          <EyeFill /> Xem phòng
                        </Button>

                        <Button
                          variant={isLocked ? 'outline' : 'outline'}
                          size="xs"
                          onClick={() => handleToggleStatus(p)}
                          style={{
                            color: isLocked ? 'var(--color-success)' : 'var(--color-danger)',
                            borderColor: isLocked ? 'var(--color-success)' : 'var(--color-danger-border)',
                          }}
                        >
                          {isLocked ? <UnlockFill /> : <LockFill />}
                          <span>{isLocked ? 'Mở khóa' : 'Khóa'}</span>
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

      {/* Modal: Room list for a Property */}
      {showRoomModal && selectedProp && (
        <Modal
          isOpen={showRoomModal}
          onClose={() => setShowRoomModal(false)}
          title={`Danh sách phòng: ${selectedProp.name}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
              Địa chỉ: <strong>{selectedProp.address}</strong> · Chủ sở hữu: <strong>{selectedProp.owner}</strong>
            </div>

            {propRooms.length === 0 ? (
              <EmptyState
                title="Chưa có phòng chi tiết nào"
                description="Cơ sở lưu trú này hiện chưa có phòng con nào được cấu hình."
              />
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>TÊN PHÒNG</TableHeaderCell>
                    <TableHeaderCell>SỨC CHỨA</TableHeaderCell>
                    <TableHeaderCell>GIÁ NGÀY THƯỜNG</TableHeaderCell>
                    <TableHeaderCell>GIÁ CUỐI TUẦN</TableHeaderCell>
                    <TableHeaderCell>TIỆN NGHI</TableHeaderCell>
                    <TableHeaderCell>TRẠNG THÁI</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {propRooms.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{r.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Mã: ROOM-{r.id}</div>
                      </TableCell>
                      <TableCell>{r.capacity} khách</TableCell>
                      <TableCell>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatVND(r.price)}</span>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontWeight: 600, color: 'var(--color-info)' }}>{r.weekendPrice ? formatVND(r.weekendPrice) : 'Như ngày thường'}</span>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{r.desc}</span>
                      </TableCell>
                      <TableCell>
                        {r.status === 'ACTIVE' ? (
                          <Badge variant="success">Hoạt động</Badge>
                        ) : (
                          <Badge variant="warning">Bảo trì</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setShowRoomModal(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

