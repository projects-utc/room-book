// Airbnb-Inspired Property Detail Page (TypeScript)
import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { Breadcrumb, DateRangePicker } from '../../components';
import { formatVND } from '../../constants';
import {
  StarFill,
  HeartFill,
  Heart,
  Share,
  PatchCheckFill,
  ShieldCheck,
  Wifi,
  Tv,
  Snow,
  DoorOpen,
  ArrowRight,
  GeoAltFill,
  PersonCircle,
  KeyFill,
  CheckCircleFill,
  CalendarCheck,
  PeopleFill,
} from 'react-bootstrap-icons';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { store, addToast } = useStore();
  const navigate = useNavigate();

  const propertyId = Number(id) || 1;
  const property = store.getProperty(propertyId) || store.getProperty(1)!;
  const rooms = store.getRoomsByProperty(property.id);
  const reviews = store.getReviewsByProperty(property.id);

  const [checkIn, setCheckIn] = useState(searchParams.get('in') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('out') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '');
  const [selectedRoomId, setSelectedRoomId] = useState<number>(rooms[0]?.id || 1);
  const [isSaved, setIsSaved] = useState(false);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0];

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 2;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    if (d2 <= d1) return 1;
    return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const nights = calculateNights();
  const unitPrice = selectedRoom?.price || property.priceMin;
  const totalPrice = unitPrice * nights;

  const handleBookNow = (roomId?: number) => {
    if (!checkIn || !checkOut) {
      addToast('Vui lòng chọn ngày nhận phòng và trả phòng trên lịch.', 'warn');
      return;
    }
    const rId = roomId || selectedRoomId;
    const params = new URLSearchParams({
      propertyId: String(property.id),
      roomId: String(rId),
      in: checkIn,
      out: checkOut,
      guests: guests || '1',
    });
    navigate(`/booking-quote?${params.toString()}`);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    addToast('Đã sao chép liên kết vào bộ nhớ tạm!', 'success');
  };

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
    addToast(isSaved ? 'Đã xóa khỏi danh sách yêu thích' : 'Đã lưu vào danh sách yêu thích!', 'info');
  };

  return (
    <div className="detail-container">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Trang chủ', to: '/' },
          { label: property.city, to: `/search?kw=${property.city}` },
          { label: property.name },
        ]}
      />

      {/* Header Title & Actions */}
      <div className="detail-header">
        <h1 className="detail-title">{property.name}</h1>
        <div className="detail-sub">
          <div className="detail-rating-meta">
            <StarFill style={{ color: 'var(--ink)', fontSize: '0.9rem' }} />
            <span>{property.rating ? property.rating.toFixed(2) : '4.95'}</span>
            <span>·</span>
            <span style={{ textDecoration: 'underline' }}>{reviews.length || 18} đánh giá</span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ink)' }}>
              <PatchCheckFill style={{ color: 'var(--airbnb-pink)' }} /> Chủ nhà siêu cấp
            </span>
            <span>·</span>
            <span style={{ color: 'var(--ink-secondary)', textDecoration: 'underline' }}>
              <GeoAltFill style={{ color: 'var(--danger)' }} /> {property.address}
            </span>
          </div>

          <div className="detail-actions">
            <button type="button" className="action-link" onClick={handleShare}>
              <Share /> Chia sẻ
            </button>
            <button type="button" className="action-link" onClick={handleToggleSave}>
              {isSaved ? <HeartFill style={{ color: 'var(--airbnb-pink)' }} /> : <Heart />}
              <span>{isSaved ? 'Đã lưu' : 'Lưu'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5-Photo Gallery Grid */}
      <div className="photo-gallery">
        <img
          src={property.image}
          alt={property.name}
          className="gallery-item gallery-main"
        />
        <img
          src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"
          alt="Không gian phòng ngủ"
          className="gallery-item"
        />
        <img
          src="https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80"
          alt="Ban công ngắm cảnh"
          className="gallery-item"
        />
        <img
          src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80"
          alt="Phòng khách thư giãn"
          className="gallery-item"
        />
        <img
          src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"
          alt="Khu bếp tiện nghi"
          className="gallery-item"
        />
      </div>

      {/* 2-Column Detail Layout */}
      <div className="detail-layout">
        {/* Left Column: Details, Highlights, Amenities, Rooms, Reviews */}
        <div className="detail-main">
          {/* Host Info Header */}
          <div className="host-section">
            <div className="host-info">
              <h3>Toàn bộ {property.type} · Chủ nhà {property.owner}</h3>
              <p>2 phòng ngủ · 2 giường · 2 phòng tắm riêng · Sức chứa tối đa {selectedRoom?.capacity || 2} khách</p>
            </div>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 'var(--radius-full)',
                background: 'var(--airbnb-gradient)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.25rem',
              }}
            >
              {property.owner.substring(0, 2).toUpperCase()}
            </div>
          </div>

          {/* Highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderBottom: '1px solid var(--line)', paddingBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <KeyFill style={{ fontSize: '1.35rem', color: 'var(--ink)', marginTop: 2 }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.98rem' }}>Tự nhận phòng</strong>
                <span style={{ color: 'var(--ink-secondary)', fontSize: '0.88rem' }}>
                  Tự nhận phòng thuận tiện bằng mã khóa thông minh (smartlock).
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <PatchCheckFill style={{ fontSize: '1.35rem', color: 'var(--airbnb-pink)', marginTop: 2 }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.98rem' }}>{property.owner} là Chủ nhà siêu cấp</strong>
                <span style={{ color: 'var(--ink-secondary)', fontSize: '0.88rem' }}>
                  Chủ nhà siêu cấp là những chủ nhà dày dạn kinh nghiệm, được đánh giá cao và cam kết mang lại kỳ nghỉ tuyệt vời.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <CheckCircleFill style={{ fontSize: '1.35rem', color: '#059669', marginTop: 2 }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.98rem' }}>Hủy miễn phí trước 48 giờ</strong>
                <span style={{ color: 'var(--ink-secondary)', fontSize: '0.88rem' }}>
                  Nhận hoàn tiền đầy đủ nếu kế hoạch chuyến đi của bạn có thay đổi đột xuất.
                </span>
              </div>
            </div>
          </div>

          {/* AirCover Guarantee */}
          <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '1.5rem' }}>
            <span
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                background: 'var(--airbnb-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                marginBottom: '0.4rem',
              }}
            >
              ODauDay Cover
            </span>
            <p style={{ margin: 0, color: 'var(--ink-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Mọi đơn đặt phòng đều được bảo vệ miễn phí trong các trường hợp Chủ nhà hủy phòng, thông tin phòng không chính xác và các vấn đề khác phát sinh trong kỳ nghỉ.
            </p>
          </div>

          {/* Description */}
          <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.75rem' }}>Giới thiệu về chỗ ở này</h2>
            <p style={{ color: 'var(--ink)', fontSize: '0.98rem', lineHeight: 1.75, margin: 0 }}>
              {property.desc}
            </p>
          </div>

          {/* Amenities */}
          <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem' }}>Tiện nghi chỗ ở</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
                <Wifi style={{ fontSize: '1.2rem', color: 'var(--ink)' }} />
                <span>Wifi tốc độ cao 500Mbps</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
                <Tv style={{ fontSize: '1.2rem', color: 'var(--ink)' }} />
                <span>Smart TV 55 inch 4K</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
                <Snow style={{ fontSize: '1.2rem', color: 'var(--ink)' }} />
                <span>Điều hòa không khí 2 chiều</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
                <DoorOpen style={{ fontSize: '1.2rem', color: 'var(--ink)' }} />
                <span>Khóa cửa thông minh</span>
              </div>
            </div>
          </div>

          {/* Room Selection */}
          <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem' }}>
              Chọn hạng phòng lưu trú ({rooms.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {rooms.map(room => (
                <div
                  key={room.id}
                  style={{
                    border: selectedRoomId === room.id ? '2px solid var(--ink)' : '1px solid var(--line)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    background: selectedRoomId === room.id ? 'var(--surface-alt)' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onClick={() => setSelectedRoomId(room.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 700 }}>
                        {room.name}
                      </h3>
                      <p style={{ margin: 0, color: 'var(--ink-secondary)', fontSize: '0.88rem' }}>
                        {room.desc}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.78rem' }}>
                          <PeopleFill /> Sức chứa: {room.capacity} người
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, display: 'block' }}>
                        {formatVND(room.price)}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>/ đêm</span>
                      <div style={{ marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          className={`btn ${selectedRoomId === room.id ? 'btn-primary' : 'btn-outline'} btn-xs`}
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedRoomId(room.id);
                            handleBookNow(room.id);
                          }}
                        >
                          Chọn phòng này <ArrowRight />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Reviews */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <StarFill style={{ color: 'var(--ink)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                {property.rating ? property.rating.toFixed(2) : '4.95'} · {reviews.length} đánh giá
              </h2>
            </div>

            {reviews.length === 0 ? (
              <p style={{ color: 'var(--ink-secondary)' }}>Chưa có đánh giá nào cho chỗ ở này.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {reviews.map(rev => (
                  <div key={rev.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 'var(--radius-full)',
                          background: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: 'var(--ink)',
                        }}
                      >
                        {rev.guestName.substring(0, 1)}
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.92rem' }}>{rev.guestName}</strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)' }}>
                          {rev.date} · Đã lưu trú
                        </span>
                      </div>
                    </div>
                    <div style={{ color: 'var(--ink)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      {'★'.repeat(rev.rating)}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ink)', lineHeight: 1.6 }}>
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sticky Reserve Card */}
        <aside>
          <div
            style={{
              position: 'sticky',
              top: '6rem',
              border: '1px solid var(--line-strong)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-card)',
              background: '#ffffff',
            }}
          >
            {/* Price Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '1.45rem', fontWeight: 800 }}>{formatVND(unitPrice)}</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--ink-secondary)' }}> / đêm</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.88rem', fontWeight: 600 }}>
                <StarFill style={{ fontSize: '0.8rem' }} />
                <span>{property.rating ? property.rating.toFixed(2) : '4.95'}</span>
                <span style={{ color: 'var(--ink-secondary)', fontWeight: 400 }}>({reviews.length})</span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <DateRangePicker
                label="Lịch nhận & trả phòng"
                value={{ start: checkIn, end: checkOut }}
                onChange={range => {
                  setCheckIn(range.start);
                  if (range.end) setCheckOut(range.end);
                }}
              />
            </div>

            <div
              style={{
                border: '1px solid var(--line-strong)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                marginBottom: '1rem',
              }}
            >

              <div style={{ padding: '0.65rem 0.75rem' }}>
                <label
                  htmlFor="reserve-guests"
                  style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                >
                  Khách
                </label>
                <select
                  id="reserve-guests"
                  value={guests}
                  onChange={e => setGuests(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', padding: 0, cursor: 'pointer' }}
                >
                  <option value="1">1 khách</option>
                  <option value="2">2 khách</option>
                  <option value="3">3 khách</option>
                  <option value="4">4 khách</option>
                  <option value="5">5+ khách</option>
                </select>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => handleBookNow()}
              className="btn btn-primary btn-block"
              style={{
                padding: '0.9rem',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-md)',
              }}
            >
              Đặt phòng
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--ink-secondary)', margin: '0.75rem 0 1.25rem' }}>
              Bạn vẫn chưa bị trừ tiền
            </p>

            {/* Transparent Price Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.92rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ textDecoration: 'underline' }}>{formatVND(unitPrice)} × {nights} đêm</span>
                <span>{formatVND(totalPrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ textDecoration: 'underline' }}>Phí dịch vụ ODauDay Stay</span>
                <span style={{ color: '#059669', fontWeight: 600 }}>0₫ (Miễn phí)</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--line)',
                  paddingTop: '0.85rem',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                }}
              >
                <span>Tổng trước thuế</span>
                <span>{formatVND(totalPrice)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
