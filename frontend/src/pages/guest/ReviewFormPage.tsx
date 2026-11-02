// Airbnb-Inspired Review Form Page (TypeScript)
import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { Breadcrumb } from '../../components/UI';
import { CheckCircleFill } from 'react-bootstrap-icons';

export default function ReviewFormPage() {
  const [searchParams] = useSearchParams();
  const { store, currentUser, addToast } = useStore();
  const navigate = useNavigate();

  const bookingCode = searchParams.get('bookingCode') || 'ODD-DEMO-0001';
  const booking = store.getBooking(bookingCode) || store.getAllBookings()[0];

  // Trạng thái mới tích hợp UI 5 sao tương tác
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(booking?.isReviewed || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (booking?.isReviewed || isSubmitted) {
      addToast('Chuyến đi này đã được gửi đánh giá trước đó.', 'error');
      return;
    }

    const res = store.submitReview({
      bookingCode,
      propertyId: booking?.propertyId || 1,
      guestUsername: currentUser?.username || 'guest.demo',
      guestName: currentUser?.fullName || 'Khách thuê',
      rating,
      comment,
    });

    if (res.success) {
      addToast('Cảm ơn bạn! Đánh giá đã được gửi thành công.', 'success');
      setIsSubmitted(true);
    } else {
      addToast(res.message || 'Lỗi khi gửi đánh giá', 'error');
    }
  };

  // Lấy dữ liệu hiển thị (kèm fallback nếu không có ảnh/ngày)
  const roomImage = (booking as any)?.roomImage || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&auto=format&fit=crop&q=80';
  const stayDate = (booking as any)?.checkIn && booking?.checkOut ? `${booking.checkIn} – ${booking.checkOut}` : '25 thg 10 – 27 thg 10, 2026';

  return (
      <div style={{ maxWidth: 720, margin: '2rem auto 5rem', padding: '0 1.5rem' }}>
        <Breadcrumb
            items={[
              { label: 'Trang chủ', to: '/' },
              { label: 'Chuyến đi', to: '/my-bookings' },
              { label: `Đánh giá #${bookingCode}` },
            ]}
        />

        {!isSubmitted ? (
            <div
                style={{
                  background: '#ffffff',
                  padding: '2rem 2.5rem',
                  borderRadius: '16px',
                  border: '1px solid #DDDDDD',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
                  maxWidth: '600px',
                  margin: '0 auto',
                  fontFamily: 'inherit',
                }}
            >
              <h4
                  style={{
                    margin: '0 0 20px 0',
                    color: '#222222',
                    fontSize: '1.45rem',
                    fontWeight: 700,
                  }}
              >
                Đánh giá kỳ lưu trú của bạn
              </h4>

              {/* Thẻ hiển thị phòng đang đánh giá (Chuẩn Airbnb Card) */}
              <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px',
                    backgroundColor: '#F7F7F7',
                    borderRadius: '12px',
                    border: '1px solid #EBEBEB',
                    marginBottom: '24px',
                  }}
              >
                <img
                    src={roomImage}
                    alt={booking?.roomName || 'Phòng'}
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                      style={{
                        display: 'inline-block',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#FF385C',
                        backgroundColor: '#FFF0F3',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        marginBottom: '6px',
                      }}
                  >
                    Đơn #{booking?.code || bookingCode} {booking?.roomId ? `· Phòng ${booking.roomId}` : ''}
                  </div>
                  <h5
                      style={{
                        margin: '0 0 2px 0',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: '#222222',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                  >
                    {booking?.roomName || 'Studio Ban Công View Hồ Tây'}
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#717171' }}>
                    {booking?.propertyName || 'ODauDay Stay'} · {stayDate}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Khu vực chọn 5 ngôi sao màu vàng (#FFB400) */}
                <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '20px',
                    }}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                      <span
                          key={star}
                          style={{
                            fontSize: '36px',
                            cursor: 'pointer',
                            color: star <= (hoverRating || rating) ? '#FFB400' : '#DDDDDD',
                            transition: 'transform 0.15s ease, color 0.15s ease',
                            userSelect: 'none',
                            lineHeight: 1,
                          }}
                          onMouseEnter={(e) => {
                            setHoverRating(star);
                            e.currentTarget.style.transform = 'scale(1.15)';
                          }}
                          onMouseLeave={(e) => {
                            setHoverRating(0);
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          onClick={() => setRating(star)}
                      >
                  ★
                </span>
                  ))}
                  <span style={{ marginLeft: '12px', fontSize: '0.95rem', color: '#717171', fontWeight: 600 }}>
                {hoverRating || rating} / 5 sao
              </span>
                </div>

                {/* Ô nhập bình luận */}
                <div style={{ width: '100%', marginBottom: '24px' }}>
              <textarea
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: '1px solid #B0B0B0',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    color: '#222222',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: 1.6,
                  }}
                  placeholder={`Chia sẻ trải nghiệm của bạn tại ${booking?.roomName || 'phòng này'}...`}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#222222';
                    e.currentTarget.style.boxShadow = '0 0 0 1px #222222';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#B0B0B0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  required
              />
                </div>

                {/* Nút Gửi chuẩn màu Airbnb (#FF385C) */}
                <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      backgroundColor: '#FF385C',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease, transform 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D70466')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FF385C')}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  Gửi đánh giá
                </button>
              </form>
            </div>
        ) : (
            /* Giao diện trạng thái Gửi thành công */
            <div
                style={{
                  border: '1px solid var(--line-strong)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-card)',
                  background: '#ffffff',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                }}
            >
              <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 'var(--radius-full)',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    margin: '0 auto 1.25rem',
                  }}
              >
                <CheckCircleFill />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
                Cảm ơn bạn đã gửi đánh giá!
              </h2>
              <p style={{ color: 'var(--ink-secondary)', maxWidth: 450, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                Đánh giá của bạn đã được lưu và hiển thị công khai trên trang thông tin chỗ ở.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Link
                    to={`/property/${booking?.propertyId || 1}`}
                    className="btn btn-primary"
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                    }}
                >
                  Xem chỗ ở
                </Link>
                <Link
                    to="/my-bookings"
                    className="btn btn-outline"
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 600,
                      fontSize: '0.92rem',
                    }}
                >
                  Về danh sách chuyến đi
                </Link>
              </div>
            </div>
        )}
      </div>
  );
}