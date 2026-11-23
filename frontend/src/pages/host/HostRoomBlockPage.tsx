// Host Room Block Page
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import {
  Breadcrumb,
  Button,
  Card,
  InputField,
  Alert,
  Badge,
  EmptyState,
  DateRangePicker,
} from '../../components';
import {
  CalendarRange,
  CalendarX,
  Trash,
  ExclamationOctagonFill,
  ShieldCheck,
} from 'react-bootstrap-icons';
import { RoomBlock } from '../../data';
import { stayApi } from '../../api/stayApi';

export default function HostRoomBlockPage() {
  const [searchParams] = useSearchParams();
  const { store, addToast } = useStore();

  const roomId = Number(searchParams.get('roomId')) || 2;
  const room = store.getAllRooms().find(r => r.id === roomId) || store.getAllRooms()[1];

  const [blocks, setBlocks] = useState<RoomBlock[]>(() => store.getRoomBlocks(roomId));
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('Bảo trì điều hoà trung tâm & sơn mới ban công');
  const [conflictError, setConflictError] = useState('');

  const refreshBlocks = () => {
    setBlocks(store.getRoomBlocks(roomId));
    stayApi.getRoomBlocks(roomId).then(res => {
      if (res.success && Array.isArray(res.data)) {
        setBlocks(res.data);
      }
    }).catch(() => {});
  };

  useEffect(() => {
    refreshBlocks();
  }, [roomId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError('');

    if (!start || !end) {
      addToast('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.', 'warn');
      return;
    }

    if (new Date(end) <= new Date(start)) {
      addToast('Ngày kết thúc phải sau ngày bắt đầu ít nhất 1 ngày.', 'warn');
      return;
    }

    const res = store.addRoomBlock({
      roomId: room.id,
      roomName: room.name,
      start,
      end,
      reason,
    });

    if (!res.success) {
      setConflictError(res.message || 'Lỗi khi tạo lịch chặn');
      addToast(res.message || 'Lỗi xung đột lịch', 'error');
    } else {
      addToast('Đã thiết lập khoảng chặn phòng thành công!', 'success');
      setStart('');
      setEnd('');
      refreshBlocks();
    }
  };

  const handleDeleteBlock = (id: number) => {
    if (window.confirm('Bạn có chắc muốn hủy lịch chặn này?')) {
      store.deleteRoomBlock(id);
      stayApi.deleteRoomBlock(id).catch(() => {});
      addToast('Đã gỡ bỏ lịch chặn phòng.', 'info');
      refreshBlocks();
    }
  };

  return (
    <div style={{ maxWidth: 1160, margin: '2rem auto', padding: '0 1.5rem' }}>
      <Breadcrumb
        items={[
          { label: 'Host Portal', to: '/host/properties' },
          { label: 'Quản lý phòng', to: '/host/rooms' },
          { label: `Chặn lịch · ${room.name}` },
        ]}
      />

      <div style={{ margin: '1rem 0 2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.35rem', color: 'var(--color-text-primary)' }}>
          Quản lý lịch khóa phòng · {room.name}
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
          Chủ động khóa các khoảng ngày tạm dừng nhận khách do kế hoạch sửa chữa, bảo dưỡng hoặc nhu cầu riêng của chủ nhà.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: Form */}
        <div>
          {conflictError && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Alert type="error" title="Không thể tạo lịch khóa phòng do trùng lịch đặt">
                <p style={{ margin: '0.35rem 0 0', lineHeight: 1.6 }}>{conflictError}</p>
              </Alert>
            </div>
          )}

          <Card title="Thiết lập khoảng ngày chặn nhận khách">
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <DateRangePicker
                  label="Khoảng ngày khóa phòng bảo trì"
                  required
                  value={{ start, end }}
                  onChange={range => {
                    setStart(range.start);
                    setEnd(range.end);
                  }}
                  helperText="Nhấp vào để chọn ngày bắt đầu và kết thúc trên lịch trực quan"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <InputField
                  id="block-reason"
                  label="Lý do khóa phòng tạm thời"
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Ví dụ: Sửa sang nội thất, bảo dưỡng điều hòa định kỳ..."
                />
              </div>

              <div
                style={{
                  background: 'var(--color-bg-app)',
                  padding: '1rem',
                  borderRadius: 12,
                  border: '1px dashed var(--color-border-strong)',
                  marginBottom: '1.5rem',
                }}
              >
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  💡 <strong>Lưu ý:</strong> Hệ thống không cho phép khóa phòng đè lên khoảng ngày đã có đơn đặt phòng hợp lệ của khách nhằm bảo vệ quyền lợi khách lưu trú.
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                block
                size="md"
                icon={<CalendarX />}
              >
                Lưu lịch chặn phòng
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Existing Blocks */}
        <div>
          <Card
            title={`Khoảng ngày đang khóa (${blocks.length})`}
            headerRight={
              <Badge variant="warning" dot>
                Bảo trì
              </Badge>
            }
          >
            {blocks.length === 0 ? (
              <EmptyState
                compact
                icon={<CalendarRange />}
                title="Không có lịch chặn nào"
                description="Hạng phòng hiện đang mở nhận khách cho toàn bộ các ngày trống."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {blocks.map(b => (
                  <div
                    key={b.id}
                    style={{
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 12,
                      padding: '1rem',
                      background: 'var(--color-bg-surface)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                        {b.start} → {b.end}
                      </strong>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{b.reason}</span>
                    </div>
                    <Button
                      size="xs"
                      variant="ghost"
                      icon={<Trash />}
                      style={{ color: 'var(--color-danger)' }}
                      title="Gỡ lịch chặn"
                      onClick={() => handleDeleteBlock(b.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
