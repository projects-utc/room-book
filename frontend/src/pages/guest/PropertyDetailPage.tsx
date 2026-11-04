// Airbnb-Inspired Property Detail Page (TypeScript)
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { Breadcrumb, DateRangePicker } from '../../components';
import { formatVND } from '../../constants';
import {
  StarFill,
  HeartFill,
  Heart,
  Share,
  PatchCheckFill,
  Wifi,
  Tv,
  Snow,
  DoorOpen,
  ArrowRight,
  GeoAltFill,
  KeyFill,
  CheckCircleFill,
  PeopleFill,
} from 'react-bootstrap-icons';
import { stayApi } from '../../api/stayApi';

// Bảng màu gradient tươi sáng cho Avatar người đánh giá
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #FF385C 0%, #FF7A00 100%)',
  'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
  'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
];

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { store, addToast } = useStore();
  const navigate = useNavigate();

  const propertyId = Number(id) || 1;
  const highlightBookingCode = searchParams.get('highlight') || '';

  const [property, setProperty] = useState<any>(() => store.getProperty(propertyId) || store.getProperty(1));
  const [rooms, setRooms] = useState<any[]>(() => store.getRoomsByProperty(propertyId));
  const [reviews, setReviews] = useState<any[]>(() => store.getReviewsByProperty(propertyId));

  // GỌI API VÀ ĐỒNG BỘ DỮ LIỆU ĐÁNH GIÁ
  useEffect(() => {
    stayApi.getProperty(propertyId).then(res => {
      if (res.success && res.data) setProperty(res.data);
    });
    stayApi.getRooms(propertyId).then(res => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) setRooms(res.data);
    });

    const localReviews = store.getReviewsByProperty(propertyId);
    setReviews(localReviews);

    stayApi.getReviews(propertyId).then(res => {
      if (res.success && Array.isArray(res.data)) {
        const merged = [...res.data];
        localReviews.forEach(lr => {
          if (!merged.some(mr => mr.bookingCode === lr.bookingCode && mr.comment === lr.comment)) {
            merged.unshift(lr);
          }
        });
        setReviews(merged);
      }
    });
  }, [propertyId, store]);

  // TỰ ĐỘNG CUỘN ĐÚNG ĐẾN BÀI ĐÁNH GIÁ NỔI BẬT KHI DỮ LIỆU ĐÃ TẢI XONG
  useEffect(() => {
    if (highlightBookingCode || location.hash === '#reviews-section') {
      const timer = setTimeout(() => {
        const highlightedCard = document.querySelector('[data-highlighted="true"]');
        if (highlightedCard) {
          highlightedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          const sectionEl = document.getElementById('reviews-section');
          if (sectionEl) {
            sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [highlightBookingCode, location.hash, reviews.length]);

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
  const unitPrice = selectedRoom?.price || property?.priceMin || 500000;
  const totalPrice = unitPrice * nights;
  const room = store.getAllRooms().find(r => r.id === selectedRoomId);

  const isDateDisabled = (dateStr: string) => {
    if (!room) return false;
    const targetDate = new Date(dateStr).getTime();

    const activeBookings = store.getAllBookings().filter(b => b.roomId === room.id && ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(b.status));
    for (const b of activeBookings) {
      const inTime = new Date(b.checkIn).getTime();
      const outTime = new Date(b.checkOut).getTime();
      if (targetDate >= inTime && targetDate < outTime) return true;
    }

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

    if (guestCount > activeRoom.capacity) {
      addToast(`Hạng phòng này chỉ phục vụ tối đa ${activeRoom.capacity} khách. Vui lòng giảm số lượng.`, 'error');
      return;
    }

    const conflict = store.checkConflict(activeRoom.id, checkIn, checkOut);
    if (conflict.hasConflict) {
      addToast(`Ngày bạn chọn đã kín chỗ: ${conflict.reason}`, 'error');
      return;
    }

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
          <h2 style={{ color: '#222222', fontSize: '1.5rem', marginBottom: '1rem' }}>Đang tải thông tin chỗ nghỉ...</h2>
          <p style={{ color: '#717171' }}>Vui lòng đợi giây lát trong khi hệ thống kết nối với máy chủ.</p>
        </div>
    );
  }

  const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
      : (property.rating ? property.rating.toFixed(2) : "5.00");

  const displayedReviews = [...reviews].reverse();

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
              <StarFill style={{ color: '#FFB400', fontSize: '1rem' }} />
              <span style={{ fontWeight: 700 }}>{avgRating}</span>
              <span>·</span>
              <a
                  href="#reviews-section"
                  style={{ textDecoration: 'underline', color: 'inherit', cursor: 'pointer', fontWeight: 600 }}
              >
                {reviews.length || 0} đánh giá
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
              <div style={{ width: 54, height: 54, borderRadius: 'var(--radius-full)', background: 'var(--airbnb-gradient)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.25rem' }}>
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
                <CheckCircleFill style={{ fontSize: '1.35rem', color: '#059669', marginTop: 2 }} />
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

            <div style={{ paddingBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem' }}>Chọn hạng phòng lưu trú ({rooms.length})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {rooms.map(roomItem => (
                    <div
                        key={roomItem.id}
                        style={{ border: selectedRoomId === roomItem.id ? '2px solid var(--ink)' : '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '1.25rem', background: selectedRoomId === roomItem.id ? 'var(--surface-alt)' : '#ffffff', cursor: 'pointer', transition: 'border-color 0.2s' }}
                        onClick={() => setSelectedRoomId(roomItem.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 700 }}>{roomItem.name}</h3>
                          <p style={{ margin: 0, color: 'var(--ink-secondary)', fontSize: '0.88rem' }}>{roomItem.desc}</p>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.78rem' }}><PeopleFill /> Sức chứa: {roomItem.capacity} người</span>
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

            {/* ================= PHẦN HIỂN THỊ ĐÁNH GIÁ MỚI (ĐẸP MẮT & SAO MÀU SẮC) ================= */}
            <div
                id="reviews-section"
                style={{
                  marginTop: '2.5rem',
                  borderTop: '1px solid var(--line)',
                  paddingTop: '2.5rem',
                  scrollMarginTop: '6rem',
                }}
            >
              {/* Banner tổng quan điểm đánh giá */}
              <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '1.25rem 1.5rem',
                    marginBottom: '2rem',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                    border: '1px solid #FDE68A',
                  }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        background: '#FFB400',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.6rem',
                        boxShadow: '0 4px 12px rgba(255, 180, 0, 0.35)',
                      }}
                  >
                    <StarFill />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E293B' }}>{avgRating}</span>
                      <span style={{ color: '#94A3B8' }}>·</span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1E293B' }}>
                        {reviews.length} đánh giá từ khách lưu trú
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                          <StarFill key={i} style={{ color: '#FFB400', fontSize: '0.95rem' }} />
                      ))}
                    </div>
                  </div>
                </div>

                <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#FFFFFF',
                      color: '#059669',
                      padding: '6px 14px',
                      borderRadius: '999px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      border: '1px solid #A7F3D0',
                    }}
                >
                  <CheckCircleFill /> 100% Đánh giá xác thực
                </div>
              </div>

              {displayedReviews.length === 0 ? (
                  <p style={{ color: 'var(--ink-secondary)' }}>Chưa có đánh giá nào cho chỗ ở này.</p>
              ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                    {displayedReviews.map((review, index) => {
                      const isHighlighted = highlightBookingCode && review.bookingCode === highlightBookingCode;
                      const avatarBg = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];

                      return (
                          <div
                              key={review.id || index}
                              data-highlighted={isHighlighted ? "true" : "false"}
                          >
                            <style>{`
                              @keyframes highlightPulse {
                                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 180, 0, 0.8); }
                                50% { transform: scale(1.02); box-shadow: 0 0 0 12px rgba(255, 180, 0, 0); background-color: #FEF3C7; }
                                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 180, 0, 0); }
                              }
                            `}</style>

                            <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  gap: '14px',
                                  padding: '1.35rem 1.5rem',
                                  borderRadius: '16px',
                                  background: isHighlighted ? 'linear-gradient(180deg, #FFFDF5 0%, #FFFBEB 100%)' : '#FFFFFF',
                                  border: isHighlighted ? '2px solid #FFB400' : '1px solid #EBEBEB',
                                  boxShadow: isHighlighted ? '0 8px 24px rgba(255, 180, 0, 0.25)' : '0 4px 14px rgba(0, 0, 0, 0.04)',
                                  animation: isHighlighted ? 'highlightPulse 1.5s ease-in-out 1' : 'none',
                                  transition: 'transform 0.2s ease',
                                }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div
                                        style={{
                                          width: '46px',
                                          height: '46px',
                                          borderRadius: '50%',
                                          background: avatarBg,
                                          color: '#FFFFFF',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontWeight: 800,
                                          fontSize: '1.1rem',
                                          boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
                                          flexShrink: 0,
                                        }}
                                    >
                                      {review.guestName ? review.guestName.charAt(0).toUpperCase() : 'G'}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.98rem', textTransform: 'uppercase' }}>
                                        {review.guestName}
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                                        <span>{review.date}</span>
                                        <span>·</span>
                                        <span style={{ color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                          <CheckCircleFill style={{ fontSize: '0.72rem' }} /> Đã lưu trú
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {isHighlighted && (
                                      <span
                                          style={{
                                            fontSize: '0.72rem',
                                            fontWeight: 800,
                                            background: '#FFB400',
                                            color: '#FFFFFF',
                                            padding: '4px 12px',
                                            borderRadius: '999px',
                                            boxShadow: '0 2px 6px rgba(255, 180, 0, 0.3)',
                                          }}
                                      >
                                        Đánh giá của bạn
                                      </span>
                                  )}
                                </div>

                                <div
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      background: '#FFFBEB',
                                      border: '1px solid #FDE68A',
                                      padding: '4px 10px',
                                      borderRadius: '999px',
                                      marginBottom: '10px',
                                    }}
                                >
                                  {Array.from({ length: 5 }).map((_, i) => (
                                      <StarFill
                                          key={i}
                                          style={{
                                            color: i < review.rating ? '#FFB400' : '#E2E8F0',
                                            fontSize: '0.88rem',
                                          }}
                                      />
                                  ))}
                                  <span style={{ marginLeft: '4px', fontSize: '0.78rem', fontWeight: 800, color: '#B45309' }}>
                                    {review.rating}.0
                                  </span>
                                </div>

                                <p style={{ margin: 0, color: '#334155', lineHeight: 1.65, fontSize: '0.94rem' }}>
                                  {review.comment}
                                </p>
                              </div>
                            </div>
                          </div>
                      );
                    })}
                  </div>
              )}
            </div>
          </div>

          <aside>
            <div style={{ position: 'sticky', top: '6rem', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-card)', background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '1.45rem', fontWeight: 800 }}>{formatVND(unitPrice)}</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--ink-secondary)' }}> / đêm</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.88rem', fontWeight: 600 }}>
                  <StarFill style={{ fontSize: '0.85rem', color: '#FFB400' }} />
                  <span>{avgRating}</span>
                  <span style={{ color: 'var(--ink-secondary)', fontWeight: 400 }}>({reviews.length})</span>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <DateRangePicker
                    label="Lịch nhận & trả phòng"
                    value={{ start: checkIn, end: checkOut }}
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
                  <span style={{ color: '#059669', fontWeight: 600 }}>0₫ (Miễn phí)</span>
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