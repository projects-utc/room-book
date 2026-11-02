// UC-07: Host Room Block Page (Standardized Components)
import React, { useState } from 'react';
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

export default function HostRoomBlockPage() {
  const [searchParams] = useSearchParams();
  const { store, addToast } = useStore();

  const roomId = Number(searchParams.get('roomId')) || 2;
  const room = store.getAllRooms().find(r => r.id === roomId) || store.getAllRooms()[1];

  const [blocks, setBlocks] = useState<RoomBlock[]>(() => store.getRoomBlocks());
  const [start, setStart] = useState('2027-02-10');
  const [end, setEnd] = useState('2027-02-12');
  const [reason, setReason] = useState('Bảo trì điều hoà trung tâm & sơn mới ban công');
  const [testScenario, setTestScenario] = useState<'default' | 'conflict'>('default');
  const [conflictError, setConflictError] = useState('');

  const refreshBlocks = () => {
    setBlocks(store.getRoomBlocks());
  };

  const handleScenarioChange = (scenario: 'default' | 'conflict') => {
    setTestScenario(scenario);
    if (scenario === 'conflict') {
      // Room 2 has booking ODD-DEMO-0004 with Linh Tran: 2027-01-20 -> 2027-01-22 (CONFIRMED)
      setStart('2027-01-20');
      setEnd('2027-01-22');
      setReason('Cần khóa phòng sửa chữa đột xuất');
      setConflictError(
        'Từ chối tạo lịch chặn (TC-13): Khoảng ngày 20/01/2027 – 22/01/2027 đang trùng với đơn đặt phòng #ODD-DEMO-0004 (CONFIRMED). Hệ thống tuân thủ quy tắc bảo đảm BR-04.'
      );
    } else {
      setStart('2027-02-10');
      setEnd('2027-02-12');
      setReason('Bảo trì điều hoà trung tâm & sơn mới ban công');
      setConflictError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError('');

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
      refreshBlocks();
    }
  };

  const handleDeleteBlock = (id: number) => {
    if (window.confirm('Bạn có chắc muốn hủy lịch chặn này?')) {
      store.deleteRoomBlock(id);
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
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.35rem', color: '#1E293B' }}>
          Quản lý lịch chặn phòng (RoomBlock) · {room.name}
        </h1>
        <p style={{ margin: 0, color: '#64748B', fontSize: '0.95rem' }}>
          Chủ động khóa các khoảng ngày tạm dừng nhận khách do kế hoạch sửa chữa, bảo dưỡng hoặc nhu cầu riêng của chủ nhà.
        </p>
      </div>

      {/* Test Scenario Switcher */}
      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#475569' }}>
            Kịch bản kiểm thử quy tắc UC-07:
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              size="sm"
              variant={testScenario === 'default' ? 'primary' : 'outline'}
              onClick={() => handleScenarioChange('default')}
            >
              Tạo lịch chặn hợp lệ
            </Button>
            <Button
              size="sm"
              variant={testScenario === 'conflict' ? 'primary' : 'outline'}
              onClick={() => handleScenarioChange('conflict')}
            >
              Xung đột với đơn đã duyệt (TC-13)
            </Button>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: Form */}
        <div>
          {conflictError && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Alert type="error" title="Từ chối tạo lịch chặn: Xung đột đơn đặt phòng (TC-13)">
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
                    if (range.end) setEnd(range.end);
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
                  background: '#F8FAFC',
                  padding: '1rem',
                  borderRadius: 12,
                  border: '1px dashed #CBD5E1',
                  marginBottom: '1.5rem',
                }}
              >
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6 }}>
                  💡 <strong>Quy tắc bảo đảm BR-04:</strong> Không cho phép tạo lịch bảo trì <code>RoomBlock</code> đè lên khoảng ngày đã có đơn giữ phòng hợp lệ của khách nhằm bảo vệ quyền lợi người tiêu dùng.
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
                      border: '1px solid #E2E8F0',
                      borderRadius: 12,
                      padding: '1rem',
                      background: '#FFFFFF',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem', color: '#1E293B' }}>
                        {b.start} → {b.end}
                      </strong>
                      <span style={{ fontSize: '0.82rem', color: '#64748B' }}>{b.reason}</span>
                    </div>
                    <Button
                      size="xs"
                      variant="ghost"
                      icon={<Trash />}
                      style={{ color: '#DC2626' }}
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
