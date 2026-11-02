// UC-06: Host Properties Management Page (Standardized Components)
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import {
  Breadcrumb,
  Button,
  InputField,
  SelectField,
  TextAreaField,
  Card,
  StatCard,
  Modal,
  Badge,
} from '../../components';
import { formatVND } from '../../constants';
import {
  PlusLg,
  Trash,
  DoorOpen,
  ShieldCheck,
  HouseDoor,
  Building,
} from 'react-bootstrap-icons';
import { Property } from '../../data';

export default function HostPropertiesPage() {
  const { store, currentUser, addToast } = useStore();
  const owner = currentUser?.username || 'host.demo';

  const [properties, setProperties] = useState<Property[]>(() => store.getHostProperties(owner));
  const [showAddModal, setShowAddModal] = useState(false);

  // New property form state
  const [name, setName] = useState('');
  const [type, setType] = useState('Homestay');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Hà Nội');
  const [area, setArea] = useState('Hồ Tây');
  const [priceMin, setPriceMin] = useState(650000);
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80');

  const refreshList = () => {
    setProperties(store.getHostProperties(owner));
  };

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    store.addProperty({
      owner,
      name,
      type,
      address,
      city,
      area,
      priceMin,
      desc,
      image,
      amenities: ['Wifi', 'Điều hòa', 'Bếp riêng'],
    });
    addToast('Đã thêm cơ sở lưu trú mới!', 'success');
    setShowAddModal(false);
    refreshList();
    setName('');
    setAddress('');
    setDesc('');
  };

  const handleDelete = (id: number, pName: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa cơ sở "${pName}"?`)) {
      store.deleteProperty(id);
      addToast('Đã xóa cơ sở lưu trú.', 'info');
      refreshList();
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '1.5rem auto', padding: '0 1rem' }}>
      <Breadcrumb
        items={[
          { label: 'Host Portal', to: '/host/properties' },
          { label: 'Quản lý cơ sở lưu trú' },
        ]}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.35rem', color: '#222222' }}>
            Cơ sở lưu trú của tôi
          </h1>
          <p style={{ margin: 0, color: '#717171', fontSize: '0.95rem' }}>
            Chủ nhà chỉ được quyền quản lý các cơ sở thuộc quyền sở hữu của mình (Tài khoản: <strong>{owner}</strong>).
          </p>
        </div>

        <Button
          variant="primary"
          icon={<PlusLg />}
          onClick={() => setShowAddModal(true)}
        >
          Đăng ký cơ sở mới
        </Button>
      </div>

      {/* Standardized KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <StatCard
          label="Tổng số cơ sở sở hữu"
          value={`${properties.length} cơ sở`}
          sublabel="Tất cả đã kiểm duyệt & đang đón khách"
          accent="brand"
          icon={<Building />}
        />
        <StatCard
          label="Tỷ lệ lấp đầy tháng này"
          value="85%"
          sublabel="Tăng 12% so với tháng trước"
          accent="ok"
        />
        <StatCard
          label="Đánh giá trung bình"
          value="5.0 ★"
          sublabel="Đạt tiêu chuẩn Superhost"
          accent="warn"
        />
      </div>

      {/* Standardized Add Property Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Đăng ký cơ sở lưu trú mới"
        subtitle="Thêm chỗ ở homestay hoặc biệt thự vào danh sách quản lý của bạn"
        size="lg"
      >
        <form onSubmit={handleAddProperty}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
            <InputField
              label="Tên cơ sở lưu trú"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ví dụ: ODauDay Stay Flamingo"
            />
            <SelectField
              label="Loại hình chỗ ở"
              required
              value={type}
              onChange={e => setType(e.target.value)}
              options={[
                { value: 'Homestay', label: 'Homestay' },
                { value: 'Biệt thự', label: 'Biệt thự sinh thái' },
                { value: 'Căn hộ', label: 'Căn hộ dịch vụ' },
                { value: 'Nhà gỗ', label: 'Nhà gỗ nghỉ dưỡng' },
              ]}
            />
          </div>

          <InputField
            label="Địa chỉ chi tiết"
            required
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Số nhà, ngõ/đường, phường/xã..."
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <SelectField
              label="Tỉnh / Thành phố"
              required
              value={city}
              onChange={e => setCity(e.target.value)}
              options={[
                { value: 'Hà Nội', label: 'Hà Nội' },
                { value: 'Hòa Bình', label: 'Hòa Bình' },
                { value: 'Quảng Ninh', label: 'Quảng Ninh' },
                { value: 'Lào Cai', label: 'Lào Cai' },
                { value: 'Lâm Đồng', label: 'Lâm Đồng' },
                { value: 'Đà Nẵng', label: 'Đà Nẵng' },
              ]}
            />
            <InputField
              label="Khu vực / Quận huyện"
              value={area}
              onChange={e => setArea(e.target.value)}
              placeholder="Ví dụ: Hồ Tây"
            />
            <InputField
              label="Giá từ (VND/đêm)"
              type="number"
              required
              value={priceMin}
              onChange={e => setPriceMin(Number(e.target.value))}
            />
          </div>

          <TextAreaField
            label="Mô tả cơ sở lưu trú"
            required
            rows={3}
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Giới thiệu điểm nổi bật, view phòng, phong cách trang trí..."
          />

          <InputField
            label="URL Hình ảnh đại diện"
            value={image}
            onChange={e => setImage(e.target.value)}
            placeholder="https://..."
          />

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              Lưu cơ sở lưu trú
            </Button>
          </div>
        </form>
      </Modal>

      {/* Standardized Card Container for Properties Table */}
      <Card
        variant="default"
        padding="none"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HouseDoor style={{ color: '#FF385C', fontSize: '1.2rem' }} />
            <span>Danh sách cơ sở lưu trú ({properties.length})</span>
          </div>
        }
        headerRight={<Badge variant="active"><ShieldCheck /> Xác thực chủ quyền</Badge>}
      >
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.85rem 1rem' }}>Cơ sở lưu trú</th>
                <th style={{ padding: '0.85rem 1rem' }}>Loại hình</th>
                <th style={{ padding: '0.85rem 1rem' }}>Địa chỉ tọa lạc</th>
                <th style={{ padding: '0.85rem 1rem' }}>Giá từ</th>
                <th style={{ padding: '0.85rem 1rem' }}>Trạng thái</th>
                <th style={{ textAlign: 'right', padding: '0.85rem 1rem' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {properties.map(p => (
                <tr key={p.id}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          backgroundImage: `url('${p.image}')`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <strong style={{ display: 'block', color: '#222222' }}>{p.name}</strong>
                        <span style={{ fontSize: '0.78rem', color: '#717171' }}>
                          {p.area || p.city}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>{p.type}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.88rem', color: '#717171' }}>{p.address}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#FF385C' }}>
                    {formatVND(p.priceMin)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <Badge variant="active">Đang đón khách</Badge>
                  </td>
                  <td style={{ textAlign: 'right', padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <Link to="/host/rooms">
                        <Button variant="outline" size="xs" icon={<DoorOpen />}>
                          Quản lý phòng
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="xs"
                        icon={<Trash />}
                        onClick={() => handleDelete(p.id, p.name)}
                        title="Xóa cơ sở"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
