// Airbnb-Inspired Property Detail Page (TypeScript)
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { Breadcrumb, DateRangePicker } from '../../components';
import { Property, Room, Review } from '../../data';
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
import { stayApi } from '../../api/stayApi';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { store, addToast } = useStore();
  const navigate = useNavigate();

  const propertyId = Number(id) || 1;
  const [property, setProperty] = useState<Property | null>(() => store.getProperty(propertyId) || store.getProperty(1));
  const [rooms, setRooms] = useState<Room[]>(() => store.getRoomsByProperty(propertyId));
  const [reviews, setReviews] = useState<Review[]>(() => store.getReviewsByProperty(propertyId));

  useEffect(() => {
    stayApi.getProperty(propertyId).then(res => {
      if (res.success && res.data) setProperty(res.data);
    });
    stayApi.getRooms(propertyId).then(res => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) setRooms(res.data);
    });
    stayApi.getReviews(propertyId).then(res => {
      if (res.success && Array.isArray(res.data)) setReviews(res.data);
    });
  }, [propertyId]);

  // Cuộn mượt mà đến mục đánh giá khi có hash #reviews trên URL
  useEffect(() => {
    if (window.location.hash === '#reviews') {
      const timer = setTimeout(() => {
        const el = document.getElementById('reviews');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [propertyId, reviews]);

  // Tính toán số sao trung bình động từ dữ liệu đánh giá thực tế trong Database
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / totalReviews)
    : (property?.rating || 5.0);
  const displayRating = totalReviews > 0 ? avgRating.toFixed(1) : (property?.rating ? property.rating.toFixed(1) : '5.0');
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
  const room = store.getAllRooms().find(r => r.id === selectedRoomId);
  // Dùng calculateQuote để tính giá đồng nhất với trang checkout (tránh lệch nếu có giá cuối tuần)
  const quote = (checkIn && checkOut && selectedRoomId)
    ? store.calculateQuote(selectedRoomId, checkIn, checkOut, guests)
    : null;
  const unitPrice = quote?.pricePerNight ?? selectedRoom?.price ?? property?.priceMin ?? 500000;
  const totalPrice = quote?.total ?? (unitPrice * nights);

  // Hàm kiểm tra ngày bị vô hiệu hóa (tối màu) để truyền vào Component Lịch
  const isDateDisabled = (dateStr: string) => {
    if (!room) return false;
    const targetDate = new Date(dateStr).getTime();

    // 1. Kiểm tra lịch đã có khách đặt
    const activeBookings = store.getAllBookings().filter(b => b.roomId === room.id && ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(b.status));
    for (const b of activeBookings) {
      const inTime = new Date(b.checkIn).getTime();
      const outTime = new Date(b.checkOut).getTime();
      // Chặn các ngày nằm trong khoảng Check-in và Check-out của khách cũ
      if (targetDate >= inTime && targetDate < outTime) return true;
    }

    // 2. Kiểm tra lịch bảo trì / khóa phòng (blocks)
    const blocks = store.getRoomBlocks(room.id);
    for (const bl of blocks) {
      const start = new Date(bl.start).getTime();
      const end = new Date(bl.end).getTime();
      if (targetDate >= start && targetDate <= end) return true;
    }

    return false;
  };

  const handleBookNow = (roomId?: number) => {
    if (!checkIn || !checkOut) {
      addToast('Vui lòng chọn ngày nhận phòng và trả phòng trên lịch.', 'warn');
      return;
    }

    const rId = roomId || selectedRoomId;
    const activeRoom = store.getAllRooms().find(r => r.id === rId);
    if (!activeRoom) return;

    const guestCount = guests ? parseInt(guests, 10) : 1;

    // Chặn 1: Kiểm tra sức chứa
    if (guestCount > activeRoom.capacity) {
      addToast(`Hạng phòng này chỉ phục vụ tối đa ${activeRoom.capacity} khách. Vui lòng giảm số lượng.`, 'error');
      return;
    }

    // Chặn 2: Gọi kho dữ liệu để check trùng lịch (Đổi từ alert sang Toast góc màn hình)
    const conflict = store.checkConflict(activeRoom.id, checkIn, checkOut);
    if (conflict.hasConflict) {
      addToast(`Ngày bạn chọn đã kín chỗ: ${conflict.reason}`, 'error');
      return;
    }

    // Nếu mọi thứ OK
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

  if (!property) {
    return (
      <div className="detail-container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-text-primary)', fontSize: '1.5rem', marginBottom: '1rem' }}>Đang tải thông tin chỗ nghỉ...</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>Vui lòng đợi giây lát trong khi hệ thống kết nối với máy chủ.</p>
      </div>
    );
  }

  return (
      <div className="detail-container">
        <Breadcrumb
            items={[
              { label: 'Trang chủ', to: '/' },
              { label: property.city, to: `/search?kw=${property.city}` },
              { label: property.name },
            ]}
        />

        <div className="detail-header">
          <h1 className="detail-title">{property.name}</h1>
          <div className="detail-sub">
            <div className="detail-rating-meta">
              <StarFill style={{ color: 'var(--color-warning)', fontSize: '0.95rem' }} />
              <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>{displayRating}</strong>
              <span>·</span>
              <a
                href="#reviews"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{ textDecoration: 'underline', color: 'var(--ink)', cursor: 'pointer', fontWeight: 600 }}
              >
                {totalReviews} đánh giá
              </a>
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

        <div className="photo-gallery">
          <img src={property.image} alt={property.name} className="gallery-item gallery-main" />
          <img src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80" alt="Không gian phòng ngủ" className="gallery-item" />
          <img src="https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80" alt="Ban công ngắm cảnh" className="gallery-item" />
          <img src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80" alt="Phòng khách thư giãn" className="gallery-item" />
          <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80" alt="Khu bếp tiện nghi" className="gallery-item" />
        </div>

        <div className="detail-layout">
          <div className="detail-main">
            <div className="host-section">
              <div className="host-info">
                <h3>Toàn bộ {property.type} · Chủ nhà {property.owner}</h3>
                <p>2 phòng ngủ · 2 giường · 2 phòng tắm riêng · Sức chứa tối đa {selectedRoom?.capacity || 2} khách</p>
              </div>
              <div style={{ width: 54, height: 54, borderRadius: 'var(--radius-full)', background: 'var(--airbnb-gradient)', color: 'var(--color-bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.25rem' }}>
                {property.owner.substring(0, 2).toUpperCase()}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderBottom: '1px solid var(--line)', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <KeyFill style={{ fontSize: '1.35rem', color: 'var(--ink)', marginTop: 2 }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.98rem' }}>Tự nhận phòng</strong>
                  <span style={{ color: 'var(--ink-secondary)', fontSize: '0.88rem' }}>Tự nhận phòng thuận tiện bằng mã khóa thông minh (smartlock).</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <PatchCheckFill style={{ fontSize: '1.35rem', color: 'var(--airbnb-pink)', marginTop: 2 }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.98rem' }}>{property.owner} là Chủ nhà siêu cấp</strong>
                  <span style={{ color: 'var(--ink-secondary)', fontSize: '0.88rem' }}>Chủ nhà siêu cấp là những chủ nhà dày dạn kinh nghiệm, được đánh giá cao và cam kết mang lại kỳ nghỉ tuyệt vời.</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <CheckCircleFill style={{ fontSize: '1.35rem', color: 'var(--color-success)', marginTop: 2 }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.98rem' }}>Hủy miễn phí trước 48 giờ</strong>
                  <span style={{ color: 'var(--ink-secondary)', fontSize: '0.88rem' }}>Nhận hoàn tiền đầy đủ nếu kế hoạch chuyến đi của bạn có thay đổi đột xuất.</span>
                </div>
              </div>
            </div>

            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, background: 'var(--airbnb-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block', marginBottom: '0.4rem' }}>ODauDay Cover</span>
              <p style={{ margin: 0, color: 'var(--ink-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>Mọi đơn đặt phòng đều được bảo vệ miễn phí trong các trường hợp Chủ nhà hủy phòng, thông tin phòng không chính xác và các vấn đề khác phát sinh trong kỳ nghỉ.</p>
            </div>

            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.75rem' }}>Giới thiệu về chỗ ở này</h2>
              <p style={{ color: 'var(--ink)', fontSize: '0.98rem', lineHeight: 1.75, margin: 0 }}>{property.desc}</p>
            </div>

            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem' }}>Tiện nghi chỗ ở</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}><Wifi style={{ fontSize: '1.2rem', color: 'var(--ink)' }} /><span>Wifi tốc độ cao 500Mbps</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}><Tv style={{ fontSize: '1.2rem', color: 'var(--ink)' }} /><span>Smart TV 55 inch 4K</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}><Snow style={{ fontSize: '1.2rem', color: 'var(--ink)' }} /><span>Điều hòa không khí 2 chiều</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}><DoorOpen style={{ fontSize: '1.2rem', color: 'var(--ink)' }} /><span>Khóa cửa thông minh</span></div>
              </div>
            </div>

            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem' }}>Chọn hạng phòng lưu trú ({rooms.length})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {rooms.map(roomItem => (
                    <div
                        key={roomItem.id}
                        style={{ border: selectedRoomId === roomItem.id ? '2px solid var(--ink)' : '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '1.25rem', background: selectedRoomId === roomItem.id ? 'var(--surface-alt)' : 'var(--color-bg-surface)', cursor: 'pointer', transition: 'border-color 0.2s' }}
                        onClick={() => setSelectedRoomId(roomItem.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 700 }}>{roomItem.name}</h3>
                          <p style={{ margin: 0, color: 'var(--ink-secondary)', fontSize: '0.88rem' }}>{roomItem.desc}</p>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <span className="badge" style={{ background: 'var(--color-bg-muted)', color: 'var(--color-text-secondary)', fontSize: '0.78rem' }}><PeopleFill /> Sức chứa: {roomItem.capacity} người</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 700, display: 'block' }}>{formatVND(roomItem.price)}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>/ đêm</span>
                          <div style={{ marginTop: '0.5rem' }}>
                            <button type="button" className={`btn ${selectedRoomId === roomItem.id ? 'btn-primary' : 'btn-outline'} btn-xs`} onClick={e => { e.stopPropagation(); setSelectedRoomId(roomItem.id); handleBookNow(roomItem.id); }}>
                              Chọn phòng này <ArrowRight />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            </div>

            {/* ── MỤC ĐÁNH GIÁ CHỖ NGHỈ (Anchor #reviews) ── */}
            <div id="reviews" style={{ scrollMarginTop: '6.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--line)' }}>
              {/* Header tổng quan đánh giá */}
              <div style={{
                background: 'linear-gradient(135deg, var(--color-warning-bg) 0%, var(--color-bg-surface) 60%, var(--color-primary-soft) 100%)',
                borderRadius: 20,
                padding: '1.75rem 2rem',
                border: '1px solid var(--color-warning-bg)',
                marginBottom: '2rem',
                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: 18,
                      background: 'var(--color-warning-bg)',
                      color: 'var(--color-warning)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.85rem',
                      boxShadow: '0 4px 12px rgba(217, 119, 6, 0.15)'
                    }}>
                      <StarFill />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
                          {displayRating}
                        </span>
                        <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>/ 5.0</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                        {totalReviews > 0 ? `Dựa trên ${totalReviews} đánh giá thực tế từ khách đã lưu trú` : 'Chưa có đánh giá nào được ghi nhận'}
                      </p>
                    </div>
                  </div>

                  {/* Badges tiêu chí nổi bật */}
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 999, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                      ✨ Sạch sẽ: <strong>4.9</strong>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 999, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                      📍 Vị trí: <strong>5.0</strong>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 999, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                      💬 Phục vụ: <strong>4.9</strong>
                    </span>
                  </div>
                </div>

                {/* Thanh phân bổ số sao */}
                {totalReviews > 0 && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px dashed var(--color-warning-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.85rem' }}>
                    {[5, 4, 3, 2, 1].map(stars => {
                      const count = reviews.filter(r => Math.round(Number(r.rating)) === stars).length;
                      const pct = Math.round((count / totalReviews) * 100);
                      return (
                        <div key={stars} style={{ fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', marginBottom: 4, fontWeight: 600 }}>
                            <span>{stars} sao</span>
                            <span>{count} ({pct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: 6, background: 'var(--color-border-subtle)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-warning)', borderRadius: 999, transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Danh sách các thẻ nhận xét */}
              {totalReviews === 0 ? (
                <div style={{
                  background: 'var(--color-bg-app)',
                  borderRadius: 16,
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  border: '1px dashed var(--color-border-strong)'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💬</div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.35rem' }}>
                    Chưa có nhận xét nào
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                    Hãy là người đầu tiên trải nghiệm chỗ nghỉ này và để lại đánh giá của bạn!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {reviews.map(rev => (
                    <div
                      key={rev.id}
                      style={{
                        background: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: 16,
                        padding: '1.35rem 1.5rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.06)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                      }}
                    >
                      {/* User Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
                            color: 'var(--color-bg-surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '1.1rem',
                            flexShrink: 0
                          }}>
                            {rev.guestName?.substring(0, 1).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                              {rev.guestName}
                            </strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.76rem', color: 'var(--color-success)', fontWeight: 600 }}>
                              <CheckCircleFill style={{ fontSize: '0.72rem' }} /> Đã xác thực lưu trú
                            </div>
                          </div>
                        </div>

                        {/* Ngày đánh giá */}
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                          {rev.date}
                        </span>
                      </div>

                      {/* Sao đánh giá */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: '0.65rem' }}>
                        {[1, 2, 3, 4, 5].map(st => (
                          <StarFill
                            key={st}
                            style={{
                              fontSize: '0.85rem',
                              color: st <= rev.rating ? 'var(--color-warning)' : 'var(--color-border-subtle)'
                            }}
                          />
                        ))}
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginLeft: 6 }}>
                          {rev.rating}.0
                        </span>
                        {rev.bookingCode && (
                          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                            #{rev.bookingCode}
                          </span>
                        )}
                      </div>

                      {/* Nội dung nhận xét */}
                      <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside>
            <div style={{ position: 'sticky', top: '6rem', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-card)', background: 'var(--color-bg-surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '1.45rem', fontWeight: 800 }}>{formatVND(unitPrice)}</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--ink-secondary)' }}> / đêm</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.88rem', fontWeight: 600 }}>
                  <StarFill style={{ fontSize: '0.85rem', color: 'var(--color-warning)' }} />
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{displayRating}</span>
                  <span style={{ color: 'var(--ink-secondary)', fontWeight: 400 }}>({totalReviews})</span>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <DateRangePicker
                    label="Lịch nhận & trả phòng"
                    value={{ start: checkIn, end: checkOut }}
                    minDate={new Date().toISOString().split('T')[0]}
                    // Truyền logic kiểm tra ngày bận vào đây
                    isDateDisabled={isDateDisabled}
                    onChange={range => {
                      let newStart = range.start;
                      let newEnd = range.end;

                      // TỰ ĐỘNG ĐẢO NGÀY: Nếu ngày trả < ngày nhận, tự tráo đổi 2 biến cho nhau
                      if (newStart && newEnd && new Date(newStart) > new Date(newEnd)) {
                        const temp = newStart;
                        newStart = newEnd;
                        newEnd = temp;
                      }

                      setCheckIn(newStart);
                      setCheckOut(newEnd || '');
                    }}
                />
              </div>

              <div style={{ border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{ padding: '0.65rem 0.75rem' }}>
                  <label htmlFor="reserve-guests" style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Khách</label>
                  <select id="reserve-guests" value={guests} onChange={e => setGuests(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', padding: 0, cursor: 'pointer' }}>
                    <option value="1">1 khách</option>
                    <option value="2">2 khách</option>
                    <option value="3">3 khách</option>
                    <option value="4">4 khách</option>
                    <option value="5">5+ khách</option>
                  </select>
                </div>
              </div>

              <button type="button" onClick={() => handleBookNow()} className="btn btn-primary btn-block" style={{ padding: '0.9rem', fontSize: '1rem', fontWeight: 700, borderRadius: 'var(--radius-md)' }}>
                Đặt phòng
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--ink-secondary)', margin: '0.75rem 0 1.25rem' }}>Bạn vẫn chưa bị trừ tiền</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.92rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ textDecoration: 'underline' }}>{formatVND(unitPrice)} × {nights} đêm</span>
                  <span>{formatVND(totalPrice)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ textDecoration: 'underline' }}>Phí dịch vụ ODauDay Stay</span>
                  <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>0₫ (Miễn phí)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: '0.85rem', fontWeight: 800, fontSize: '1.05rem' }}>
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