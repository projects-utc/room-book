// Airbnb-Inspired Property Detail Page (TypeScript)
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { Breadcrumb, DateRangePicker } from '../../components';
import { Property, Room, Review, Booking } from '../../data';
import { formatVND } from '../../constants';
import {
  StarFill,
  Share,
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
  LockFill,
} from 'react-bootstrap-icons';
import { stayApi } from '../../api/stayApi';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { store, addToast } = useStore();
  const navigate = useNavigate();

  const propertyId = Number(id) || 1;
  const [property, setProperty] = useState<Property | null>(() => store.getProperty(propertyId));
  const [rooms, setRooms] = useState<Room[]>(() => store.getRoomsByProperty(propertyId));
  const [reviews, setReviews] = useState<Review[]>(() => store.getReviewsByProperty(propertyId));
  const [bookings, setBookings] = useState<Booking[]>(() => store.getAllBookings());

  useEffect(() => {
    stayApi.getProperty(propertyId).then(res => {
      if (res.success && res.data) setProperty(res.data);
    });
    stayApi.getRooms(propertyId).then(res => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setRooms(res.data);
        setSelectedRoomId(prev => {
          const exists = res.data.some((r: Room) => r.id === prev);
          return exists ? prev : res.data[0].id;
        });
      }
    });
    stayApi.getBookings().then(res => {
      if (res.success && Array.isArray(res.data)) {
        setBookings(res.data);
        res.data.forEach((b: Booking) => store.syncBookingFromApi(b));
      }
    }).catch(() => {});
    stayApi.getReviews(propertyId).then(res => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        // Hợp nhất với reviews cục bộ để bài vừa đánh giá luôn hiển thị tức thì
        const localRevs = store.getReviewsByProperty(propertyId);
        const map = new Map<string, Review>();
        res.data.forEach(r => map.set(r.bookingCode || String(r.id), r));
        localRevs.forEach(r => map.set(r.bookingCode || String(r.id), r));
        setReviews(Array.from(map.values()));
      } else {
        const localRevs = store.getReviewsByProperty(propertyId);
        if (localRevs.length > 0) setReviews(localRevs);
      }
    });
  }, [propertyId]);

  const highlightCode = searchParams.get('highlight');

  // Cuộn mượt mà và trỏ tới đúng bài đánh giá cần xem (khi có hash #reviews hoặc param highlight)
  useEffect(() => {
    if (window.location.hash === '#reviews' || highlightCode) {
      if (highlightCode) {
        setReviewFilter('ALL');
      }
      const timer = setTimeout(() => {
        if (highlightCode) {
          const targetCard = document.getElementById(`review-${highlightCode}`);
          if (targetCard) {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
        }
        const el = document.getElementById('reviews');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [propertyId, reviews, highlightCode]);

  // 1. Số lượng đánh giá thực tế (ưu tiên mảng reviews, sau đó là trường của property)
  const reviewCount = reviews.length > 0
    ? reviews.length
    : (property?.reviewsCount ?? property?.reviewCount ?? 0);

  // 2. Điểm số trung bình thực tế
  const averageRating = useMemo(() => {
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
      return Math.round((sum / reviews.length) * 10) / 10;
    }
    if (property?.rating != null && property.rating > 0) return Math.round(Number(property.rating) * 10) / 10;
    if (property?.averageRating != null && property.averageRating > 0) return Math.round(Number(property.averageRating) * 10) / 10;
    return null;
  }, [reviews, property]);

  // 3. Cờ điều kiện xác định homestay có đánh giá hay là chưa có đánh giá
  const hasReviews = Boolean(reviewCount > 0 && averageRating !== null && averageRating > 0);

  const [reviewFilter, setReviewFilter] = useState<'ALL' | '5' | '4' | '3' | '2' | '1'>('ALL');

  const filterCounts = useMemo(() => {
    return {
      all: reviews.length,
      5: reviews.filter(r => Math.round(Number(r.rating)) === 5).length,
      4: reviews.filter(r => Math.round(Number(r.rating)) === 4).length,
      3: reviews.filter(r => Math.round(Number(r.rating)) === 3).length,
      2: reviews.filter(r => Math.round(Number(r.rating)) === 2).length,
      1: reviews.filter(r => Math.round(Number(r.rating)) === 1).length,
    };
  }, [reviews]);

  const displayedReviews = useMemo(() => {
    if (reviewFilter === 'ALL') return reviews;
    const starNum = Number(reviewFilter);
    return reviews.filter(r => Math.round(Number(r.rating)) === starNum);
  }, [reviews, reviewFilter]);
  const [checkIn, setCheckIn] = useState(searchParams.get('in') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('out') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '');
  const [selectedRoomId, setSelectedRoomId] = useState<number>(rooms[0]?.id || 1);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0];

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 2;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    if (d2 <= d1) return 1;
    return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const nights = calculateNights();
  const room = selectedRoom || rooms.find(r => r.id === selectedRoomId) || store.getAllRooms().find(r => r.id === selectedRoomId);
  // Dùng calculateQuote để tính giá đồng nhất với trang checkout (tránh lệch nếu có giá cuối tuần)
  const quote = (checkIn && checkOut && (selectedRoom || selectedRoomId))
    ? store.calculateQuote(selectedRoom?.id || selectedRoomId, checkIn, checkOut, guests, selectedRoom)
    : null;
  const unitPrice = selectedRoom?.price ?? quote?.pricePerNight ?? property?.priceMin ?? 500000;
  const totalPrice = quote?.total ?? (unitPrice * nights);

  // Hàm kiểm tra ngày bị vô hiệu hóa (tối màu / gạch ngang) để truyền vào Component Lịch
  const isDateDisabled = (dateStr: string) => {
    const currentRoom = selectedRoom || rooms.find(r => r.id === selectedRoomId) || rooms[0];
    if (!currentRoom) return false;

    const dStr = dateStr.substring(0, 10);

    // 1. Kiểm tra lịch đã có khách đặt từ API Backend và Store
    const allBookings = bookings.length > 0 ? bookings : store.getAllBookings();
    const activeBookings = allBookings.filter(b => {
      const status = (b.status || '').toUpperCase();
      if (['CANCELLED', 'REJECTED'].includes(status)) return false;

      // Khớp phòng: nếu trùng roomId HOẶC (nếu homestay chỉ có 1 phòng/nguyên căn thì trùng propertyId)
      const matchesRoom = (b.roomId && Number(b.roomId) === Number(currentRoom.id)) ||
        (Number(b.propertyId) === Number(propertyId) && (rooms.length <= 1 || Number(b.roomId) === Number(currentRoom.id)));

      return matchesRoom;
    });

    for (const b of activeBookings) {
      if (!b.checkIn || !b.checkOut) continue;
      const bIn = b.checkIn.substring(0, 10);
      const bOut = b.checkOut.substring(0, 10);
      // Chặn các ngày từ ngày nhận phòng đến trước ngày trả phòng
      if (dStr >= bIn && dStr < bOut) return true;
    }

    // 2. Kiểm tra lịch bảo trì / khóa phòng (blocks)
    const blocks = store.getRoomBlocks(currentRoom.id);
    for (const bl of blocks) {
      if (!bl.start || !bl.end) continue;
      const bStart = bl.start.substring(0, 10);
      const bEnd = bl.end.substring(0, 10);
      if (dStr >= bStart && dStr <= bEnd) return true;
    }

    return false;
  };

  const handleBookNow = (roomId?: number) => {
    if (rooms.length === 0) {
      addToast('Chỗ nghỉ này hiện chưa mở bán hạng phòng nào.', 'warn');
      return;
    }

    if (!checkIn || !checkOut) {
      addToast('Vui lòng chọn ngày nhận và trả phòng.', 'warn');
      return;
    }

    const rId = roomId || selectedRoomId || rooms[0]?.id;
    const activeRoom = rooms.find(r => r.id === rId) || store.getAllRooms().find(r => r.id === rId);
    if (!activeRoom) {
      addToast('Không tìm thấy thông tin phòng hợp lệ.', 'error');
      return;
    }

    const guestCount = guests ? parseInt(guests, 10) : 1;

    // Chặn 1: Kiểm tra sức chứa
    if (guestCount > activeRoom.capacity) {
      addToast(`Phòng này tối đa ${activeRoom.capacity} khách. Vui lòng chọn lại số khách.`, 'error');
      return;
    }

    // Chặn 2: Kiểm tra trùng lịch trước khi chuyển trang (kiểm tra cả danh sách đơn từ API và Store)
    const allBookings = bookings.length > 0 ? bookings : store.getAllBookings();
    const in1 = checkIn.substring(0, 10);
    const out1 = checkOut.substring(0, 10);
    const conflictBooking = allBookings.find(b => {
      const status = (b.status || '').toUpperCase();
      if (['CANCELLED', 'REJECTED'].includes(status)) return false;
      const matchesRoom = (b.roomId && Number(b.roomId) === Number(activeRoom.id)) ||
        (Number(b.propertyId) === Number(propertyId) && (rooms.length <= 1 || Number(b.roomId) === Number(activeRoom.id)));
      if (!matchesRoom) return false;
      const bIn = (b.checkIn || '').substring(0, 10);
      const bOut = (b.checkOut || '').substring(0, 10);
      return in1 < bOut && out1 > bIn;
    });

    if (conflictBooking) {
      addToast(`Phòng đã có khách đặt trong khoảng ngày bạn chọn (Đơn: ${conflictBooking.code}). Vui lòng chọn ngày khác.`, 'error');
      return;
    }

    const conflict = store.checkConflict(activeRoom.id, checkIn, checkOut);
    if (conflict.hasConflict) {
      addToast(`Phòng đã kín lịch trong khoảng ngày bạn chọn (${conflict.reason}).`, 'error');
      return;
    }

    // Nếu mọi thứ OK
    const params = new URLSearchParams({
      propertyId: String(property?.id || propertyId),
      roomId: String(activeRoom.id),
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
            {hasReviews ? (
              <>
                <StarFill style={{ color: '#FFD700', fontSize: '0.95rem' }} />
                <strong style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{averageRating?.toFixed(1)}</strong>
                <span>·</span>
                <a
                  href="#reviews"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ textDecoration: 'underline', color: 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 600 }}
                >
                  {reviewCount} đánh giá
                </a>
              </>
            ) : (
              <a
                href="#reviews"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-700 transition-colors"
                style={{
                  color: '#6B7280',
                  textDecoration: 'underline',
                  textDecorationColor: '#D1D5DB',
                  textUnderlineOffset: '2px',
                  cursor: 'pointer',
                  fontSize: '0.92rem',
                  fontWeight: 500,
                }}
              >
                Chưa có đánh giá
              </a>
            )}
            <span>·</span>
            <span style={{ color: 'var(--color-text-secondary)', textDecoration: 'underline' }}>
              <GeoAltFill style={{ color: 'var(--color-danger)' }} /> {property.address}
            </span>
          </div>

          <div className="detail-actions">
            <button type="button" className="action-link" onClick={handleShare}>
              <Share /> Chia sẻ
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
              {rooms.length === 0 ? (
                <p style={{ color: 'var(--ink-secondary)', fontStyle: 'italic', margin: 0, padding: '1rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)' }}>
                  Chỗ nghỉ này hiện chưa mở bán hạng phòng nào. Vui lòng quay lại sau!
                </p>
              ) : (
                rooms.map(roomItem => (
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
              )))}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: THẺ ĐẶT PHÒNG STICKY & ADAPTIVE */}
        <aside className="detail-sidebar">
          <div className="unified-sidebar-sticky">
            <div className="unified-sidebar-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.85rem' }}>
                <div>
                  <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{formatVND(unitPrice)}</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}> / đêm</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem', fontWeight: 600 }}>
                  {hasReviews ? (
                    <>
                      <StarFill style={{ fontSize: '0.9rem', color: '#FFD700' }} />
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{averageRating?.toFixed(1)}</span>
                      <span>·</span>
                      <a
                        href="#reviews"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        style={{ color: 'var(--color-text-secondary)', fontWeight: 500, textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        {reviewCount} đánh giá
                      </a>
                    </>
                  ) : (
                    <a
                      href="#reviews"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-700 transition-colors"
                      style={{
                        color: '#6B7280',
                        textDecoration: 'underline',
                        textDecorationColor: '#D1D5DB',
                        textUnderlineOffset: '2px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                      }}
                    >
                      Chưa có đánh giá
                    </a>
                  )}
                </div>
              </div>

              {/* Huy hiệu bảo vệ quyền lợi khách hàng */}
              <div style={{ marginBottom: '1rem' }}>
                <div
                  title="ODauDay hướng đến bảo vệ quyền lợi khách hàng. Các quyền lợi và điều kiện hỗ trợ được áp dụng theo chính sách đặt phòng."
                  role="note"
                  aria-label="Bảo vệ quyền lợi khách hàng"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    borderRadius: 999,
                    background: 'linear-gradient(135deg, var(--color-success-bg), var(--color-success-border))',
                    border: '1px solid var(--color-success-border)',
                    color: 'var(--color-success)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'help',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)',
                  }}
                >
                  <ShieldCheck style={{ fontSize: '1rem', color: 'var(--color-success)', flexShrink: 0 }} />
                  <span>Bảo vệ quyền lợi khách hàng</span>
                  <span style={{ width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--color-success-border)', color: 'var(--color-success)', fontSize: 11, fontWeight: 800 }}>i</span>
                </div>
              </div>

              {/* Hạng phòng đang chọn */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: 12,
                background: 'var(--color-bg-app)',
                border: '1px solid var(--color-border-subtle)',
                marginBottom: '1rem',
                fontSize: '0.85rem',
              }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Hạng phòng đang chọn:</span>
                <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.88rem' }}>{selectedRoom?.name || 'Tiêu chuẩn'}</strong>
              </div>

              {/* Chọn ngày nhận - trả phòng */}
              <div style={{ marginBottom: '1rem' }}>
                <DateRangePicker
                  label="Nhận phòng - Trả phòng"
                  value={{ start: checkIn, end: checkOut }}
                  minDate={new Date().toISOString().split('T')[0]}
                  isDateDisabled={isDateDisabled}
                  onChange={range => {
                    let newStart = range.start;
                    let newEnd = range.end;
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

              {/* Chọn số khách */}
              <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 12, overflow: 'hidden', marginBottom: '1.25rem', background: 'var(--color-bg-surface)' }}>
                <div style={{ padding: '0.65rem 0.85rem' }}>
                  <label htmlFor="reserve-guests" style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: 2 }}>Số lượng khách</label>
                  <select id="reserve-guests" value={guests} onChange={e => setGuests(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', padding: 0, cursor: 'pointer', background: 'transparent', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    <option value="1">1 khách</option>
                    <option value="2">2 khách</option>
                    <option value="3">3 khách</option>
                    <option value="4">4 khách</option>
                    <option value="5">5+ khách</option>
                  </select>
                </div>
              </div>

              {/* Nút Đặt phòng */}
              <button
                type="button"
                disabled={rooms.length === 0}
                onClick={() => handleBookNow()}
                className="btn btn-primary btn-block"
                style={{
                  width: '100%',
                  height: 48,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: rooms.length === 0 ? 0.6 : 1,
                  cursor: rooms.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <CalendarCheck style={{ fontSize: '1.1rem' }} />
                <span>{rooms.length === 0 ? 'Chưa mở bán phòng' : 'Đặt phòng'}</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '0.75rem 0 1.25rem' }}>
                <LockFill style={{ fontSize: '0.78rem' }} />
                <span>Bạn vẫn chưa bị trừ tiền ở bước này</span>
              </div>

              {/* Chi tiết giá dự tính */}
              <h3 style={{ fontSize: '1.02rem', fontWeight: 750, margin: '0 0 0.8rem', color: 'var(--color-text-primary)' }}>Chi tiết giá dự tính</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}>
                  <span>Giá phòng · {nights} đêm</span>
                  <strong style={{ color: 'var(--color-text-secondary)' }}>{formatVND(totalPrice)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}>
                  <span>Phí dịch vụ ODauDay Stay</span>
                  <strong style={{ color: 'var(--color-success)' }}>Miễn phí</strong>
                </div>
                <div style={{
                  marginTop: 4,
                  padding: '0.85rem 1rem',
                  borderRadius: 12,
                  background: 'linear-gradient(120deg, var(--color-primary-soft), var(--color-primary-soft))',
                  border: '1px solid var(--color-primary-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-danger)' }}>Tổng cộng (tạm tính)</span>
                  <strong style={{ fontSize: '1.18rem', color: 'var(--color-primary)', fontWeight: 800 }}>{formatVND(totalPrice)}</strong>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MỤC ĐÁNH GIÁ CHỖ NGHỈ (Anchor #reviews) ── */}
        <div id="reviews" className="detail-reviews-container" style={{ scrollMarginTop: '6.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--line)' }}>
            {/* Header tổng quan đánh giá phong cách Shopee */}
            {hasReviews ? (
              <div style={{
                background: 'var(--color-bg-surface)',
                borderRadius: 16,
                padding: '1.75rem 2rem',
                border: '1px solid var(--color-border-subtle)',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '2.5rem',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
              }}>
                {/* Cột Trái: Điểm số trung bình & 5 sao vàng */}
                <div style={{ textAlign: 'center', minWidth: 160 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {averageRating?.toFixed(1)}
                    </span>
                    <span style={{ fontSize: '1.15rem', color: 'var(--color-primary)', fontWeight: 600 }}>trên 5</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                    {[1, 2, 3, 4, 5].map(i => {
                      const ratingVal = averageRating ?? 0;
                      let fillPercent = 0;
                      if (ratingVal >= i) {
                        fillPercent = 100;
                      } else if (ratingVal > i - 1) {
                        fillPercent = Math.round((ratingVal - (i - 1)) * 100);
                      }

                      return (
                        <div
                          key={i}
                          style={{
                            position: 'relative',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 22,
                            height: 22,
                            lineHeight: 1,
                          }}
                        >
                          {/* Ngôi sao nền màu xám */}
                          <StarFill
                            size={22}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              color: 'var(--color-border-strong)',
                              display: 'block',
                            }}
                          />
                          {/* Ngôi sao vàng phủ lên cắt theo đúng tỷ lệ phần trăm (clipPath) */}
                          {fillPercent > 0 && (
                            <StarFill
                              size={22}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                color: 'var(--color-star)',
                                display: 'block',
                                clipPath: `inset(0 ${100 - fillPercent}% 0 0)`,
                                WebkitClipPath: `inset(0 ${100 - fillPercent}% 0 0)`,
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cột Phải: Lưới Nút Bấm Lọc Shopee */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', flex: 1, alignItems: 'center' }}>
                  {[
                    { key: 'ALL', label: `Tất cả (${filterCounts.all})` },
                    { key: '5', label: `5 Sao (${filterCounts['5']})` },
                    { key: '4', label: `4 Sao (${filterCounts['4']})` },
                    { key: '3', label: `3 Sao (${filterCounts['3']})` },
                    { key: '2', label: `2 Sao (${filterCounts['2']})` },
                    { key: '1', label: `1 Sao (${filterCounts['1']})` },
                  ].map(f => {
                    const isActive = reviewFilter === f.key;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setReviewFilter(f.key as any)}
                        style={{
                          height: 36,
                          padding: '0 16px',
                          borderRadius: 6,
                          border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
                          background: isActive ? 'var(--color-primary-soft)' : 'var(--color-bg-surface)',
                          color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                          fontWeight: isActive ? 700 : 500,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{
                background: 'var(--color-bg-app)',
                borderRadius: 20,
                padding: '2rem',
                border: '1px solid var(--color-border-subtle)',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem'
              }}>
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  background: 'var(--color-star-bg)',
                  color: 'var(--color-star)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  flexShrink: 0
                }}>
                  <StarFill />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 0.25rem' }}>
                    Chưa có đánh giá
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>
                    Chỗ nghỉ này chưa có lượt đánh giá nào từ khách lưu trú. Hãy là người đầu tiên trải nghiệm và chia sẻ cảm nhận!
                  </p>
                </div>
              </div>
            )}

            {/* Danh sách các thẻ nhận xét */}
            {!hasReviews ? (
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
            ) : displayedReviews.length === 0 ? (
              <div style={{
                background: 'var(--color-bg-surface)',
                borderRadius: 16,
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                border: '1px dashed var(--color-border-strong)',
                marginBottom: '1rem'
              }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: '0 0 1rem' }}>
                  Không có bài đánh giá nào phù hợp với bộ lọc đang chọn.
                </p>
                <button
                  type="button"
                  onClick={() => setReviewFilter('ALL')}
                  className="btn btn-primary btn-sm"
                >
                  Xem tất cả {reviewCount} đánh giá
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {displayedReviews.map(rev => {
                  const isHighlighted = Boolean(highlightCode && (rev.bookingCode === highlightCode || String(rev.id) === highlightCode));
                  return (
                    <div
                      key={rev.id}
                      id={`review-${rev.bookingCode || rev.id}`}
                      style={{
                        background: isHighlighted
                          ? 'linear-gradient(135deg, #FFF8F6 0%, var(--color-bg-surface) 100%)'
                          : 'var(--color-bg-surface)',
                        border: isHighlighted
                          ? '2px solid var(--color-primary)'
                          : '1px solid var(--color-border-subtle)',
                        borderRadius: 16,
                        padding: '1.35rem 1.5rem',
                        boxShadow: isHighlighted
                          ? '0 8px 26px rgba(238, 77, 45, 0.22)'
                          : '0 2px 8px rgba(0,0,0,0.03)',
                        transform: isHighlighted ? 'translateY(-2px)' : 'none',
                        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s ease',
                        position: 'relative',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = isHighlighted
                          ? '0 12px 32px rgba(238, 77, 45, 0.28)'
                          : '0 8px 20px rgba(0,0,0,0.08)';
                        if (!isHighlighted) {
                          e.currentTarget.style.borderColor = 'var(--color-primary-border)';
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = isHighlighted ? 'translateY(-2px)' : 'translateY(0)';
                        e.currentTarget.style.boxShadow = isHighlighted
                          ? '0 8px 26px rgba(238, 77, 45, 0.22)'
                          : '0 2px 8px rgba(0,0,0,0.03)';
                        if (!isHighlighted) {
                          e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                        }
                      }}
                    >
                      {/* Huy hiệu đánh giá vừa gửi / đang xem */}
                      {isHighlighted && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 12px',
                          borderRadius: 999,
                          background: 'var(--color-primary-soft)',
                          color: 'var(--color-primary)',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          marginBottom: '0.75rem',
                          border: '1px solid var(--color-primary-border)',
                        }}>
                          ✨ Đánh giá bạn vừa gửi / đang xem
                        </div>
                      )}
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
                              color: st <= rev.rating ? 'var(--color-star)' : 'var(--color-border-subtle)'
                            }}
                          />
                        ))}
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginLeft: 6 }}>
                          {Number(rev.rating).toFixed(1)}
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
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
  );
}
