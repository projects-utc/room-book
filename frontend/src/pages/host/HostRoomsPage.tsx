// UC-07: Host Rooms Management Page (Standardized Components)
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import {
  Breadcrumb,
  Button,
  Card,
  Modal,
  InputField,
  TextAreaField,
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
  DoorOpen,
  PlusLg,
  Trash,
  CalendarRange,
  PeopleFill,
  CheckCircleFill,
} from 'react-bootstrap-icons';
import { Room } from '../../data';

export default function HostRoomsPage() {
  const { store, addToast } = useStore();

  const [rooms, setRooms] = useState<Room[]>(() => store.getAllRooms());
  const [showAddForm, setShowAddForm] = useState(false);

  // Add room form state
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(2);
  const [price, setPrice] = useState(650000);
  const [desc, setDesc] = useState('');

  const refreshList = () => {
    setRooms(store.getAllRooms());
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    store.addRoom({
      propertyId: 1,
      propertyName: 'ODauDay Stay Hồ Tây',
      name,
      capacity: Number(capacity),
      price: Number(price),
      desc,
      status: 'ACTIVE',
    });
    addToast('Đã thêm hạng phòng mới!', 'success');
    setShowAddForm(false);
    refreshList();
    setName('');
    setDesc('');
  };

  const handleDelete = (id: number, rName: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa phòng "${rName}"?`)) {
      store.deleteRoom(id);
      addToast('Đã xóa hạng phòng.', 'info');
      refreshList();
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1.5rem' }}>
      <Breadcrumb
        items={[
          { label: 'Host Portal', to: '/host/properties' },
          { label: 'ODauDay Stay Hồ Tây', to: '/host/properties' },
          { label: 'Quản lý phòng & bảng giá' },
        ]}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', margin: '1rem 0 2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.35rem', color: '#1E293B' }}>
            Danh sách hạng phòng vận hành
          </h1>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.95rem' }}>
            Quản lý sức chứa tối đa (BR-02), đơn giá niêm yết mỗi đêm và lịch chặn bảo trì (RoomBlock).
          </p>
        </div>
        <Button variant="primary" icon={<PlusLg />} onClick={() => setShowAddForm(true)}>
          Thêm hạng phòng mới
        </Button>
      </div>

      {/* Rooms Table Card */}
      <Card
        title={`Các hạng phòng đang vận hành (${rooms.length})`}
        headerRight={<Badge variant="neutral">Đồng bộ thời gian thực</Badge>}
      >
        {rooms.length === 0 ? (
          <EmptyState
            compact
            icon={<DoorOpen />}
            title="Chưa có hạng phòng nào"
            description="Hãy nhấn 'Thêm hạng phòng mới' để bắt đầu thiết lập các phòng kinh doanh."
            action={
              <Button variant="primary" icon={<PlusLg />} onClick={() => setShowAddForm(true)}>
                Thêm phòng ngay
              </Button>
            }
          />
        ) : (
          <Table hover>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Hạng phòng</TableHeaderCell>
                <TableHeaderCell>Cơ sở trực thuộc</TableHeaderCell>
                <TableHeaderCell>Sức chứa</TableHeaderCell>
                <TableHeaderCell>Đơn giá / đêm</TableHeaderCell>
                <TableHeaderCell>Trạng thái</TableHeaderCell>
                <TableHeaderCell align="right">Thao tác</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rooms.map(room => (
                <TableRow key={room.id}>
                  <TableCell>
                    <strong style={{ display: 'block', color: '#1E293B' }}>{room.name}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{room.desc}</span>
                  </TableCell>
                  <TableCell>{room.propertyName}</TableCell>
                  <TableCell>
                    <Badge variant="neutral" icon={<PeopleFill />}>
                      {room.capacity} người
                    </Badge>
                  </TableCell>
                  <TableCell bold style={{ color: 'var(--airbnb-pink)' }}>
                    {formatVND(room.price)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success" dot icon={<CheckCircleFill />}>
                      ACTIVE
                    </Badge>
                  </TableCell>
                  <TableCell align="right">
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link to={`/host/roomblock?roomId=${room.id}`}>
                        <Button size="xs" variant="outline" icon={<CalendarRange />}>
                          Chặn lịch (RoomBlock)
                        </Button>
                      </Link>
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={<Trash />}
                        style={{ color: '#DC2626' }}
                        title="Xóa phòng"
                        onClick={() => handleDelete(room.id, room.name)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Add Room Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Thêm hạng phòng mới"
        subtitle="Khai báo tên phòng, sức chứa tối đa và biểu giá kinh doanh theo đêm"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleAddRoom as any}>
              Lưu hạng phòng
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddRoom}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <InputField
              label="Tên hạng phòng"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ví dụ: Phòng Panorama Hồ Tây"
            />
            <InputField
              label="Sức chứa tối đa (Người)"
              type="number"
              min="1"
              max="12"
              required
              value={capacity}
              onChange={e => setCapacity(Number(e.target.value))}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <InputField
              label="Đơn giá / đêm (VNĐ)"
              type="number"
              required
              value={price}
              onChange={e => setPrice(Number(e.target.value))}
            />
          </div>

          <TextAreaField
            label="Mô tả tiện nghi phòng"
            required
            rows={3}
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Số lượng giường, diện tích, hướng nhìn, ban công, bồn tắm nằm..."
          />
        </form>
      </Modal>
    </div>
  );
}
