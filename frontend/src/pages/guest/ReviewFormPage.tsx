// Airbnb-Inspired Review Form Page (TypeScript)
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { Breadcrumb } from '../../components/UI';
import { ShieldCheck } from 'react-bootstrap-icons';

export default function ReviewFormPage() {
    const [searchParams] = useSearchParams();
    const { store, currentUser, addToast } = useStore();
    const navigate = useNavigate();

    const bookingCode = searchParams.get('bookingCode') || 'ODD-DEMO-0001';
    const booking = store.getBooking(bookingCode) || store.getAllBookings()[0];
    const targetPropertyId = booking?.propertyId || 1;

    // Trạng thái Form
    const [rating, setRating] = useState<number>(5);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Nhãn cảm xúc theo số sao
    const ratingLabels: Record<number, { text: string; color: string }> = {
        1: { text: 'Rất tệ', color: '#EF4444' },
        2: { text: 'Không hài lòng', color: '#F97316' },
        3: { text: 'Bình thường', color: '#EAB308' },
        4: { text: 'Rất tốt', color: '#10B981' },
        5: { text: 'Tuyệt vời xuất sắc!', color: '#FFB400' },
    };

    // NẾU ĐƠN NÀY ĐÃ ĐÁNH GIÁ -> ĐÁ VỀ TRANG CHUYẾN ĐI NGAY LẬP TỨC
    useEffect(() => {
        if (booking?.isReviewed) {
            addToast('Chuyến đi này đã được đánh giá.', 'info');
            navigate('/my-bookings');
        }
    }, [booking, navigate, addToast]);

    // HÀM SUBMIT SỬ DỤNG FETCH ĐỂ GỌI API THỰC TẾ
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (booking?.isReviewed || isSubmitting) return;

        setIsSubmitting(true);

        const reviewPayload = {
            bookingCode,
            propertyId: targetPropertyId,
            rating,
            comment,
        };

        try {
            // Gửi dữ liệu xuống API bằng Fetch và kèm Header thông tin người dùng
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Truyền tên thật của user xuống backend qua Header
                    'X-User-Name': currentUser?.username || 'guest_user',
                    'X-Full-Name': currentUser?.fullName || 'Khách Hàng Ẩn Danh'
                },
                body: JSON.stringify(reviewPayload)
            });

            const responseData = await response.json();

            if (response.ok && (responseData.success || response.status === 201)) {
                // Đánh dấu vào store cục bộ để UI biết đơn này đã được đánh giá
                const localRes = store.submitReview({
                    ...reviewPayload,
                    guestUsername: currentUser?.username || 'guest_user',
                    guestName: currentUser?.fullName || 'Khách Hàng Ẩn Danh'
                });

                if (localRes.success) {
                    addToast('Cảm ơn bạn! Đánh giá đã được gửi thành công.', 'success');
                    // Chuyển hướng về trang chi tiết chỗ ở kèm highlight
                    navigate(`/property/${targetPropertyId}?highlight=${bookingCode}#reviews-section`);
                }
            } else {
                throw new Error(responseData.message || 'Không thể gửi đánh giá, vui lòng thử lại sau.');
            }

        } catch (error: any) {
            console.error("Lỗi khi gọi API submit review:", error);
            const errorMsg = error.message || 'Không thể gửi đánh giá, vui lòng thử lại sau.';
            addToast(errorMsg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const roomImage = (booking as any)?.roomImage || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&auto=format&fit=crop&q=80';
    const stayDate = (booking as any)?.checkIn && (booking as any)?.checkOut ? `${(booking as any).checkIn} – ${(booking as any).checkOut}` : '25 thg 10 – 27 thg 10, 2026';
    const activeStar = hoverRating || rating;

    // Nếu đã review thì không render gì cả để tránh nháy giao diện trước khi bị đá đi
    if (booking?.isReviewed) return null;

    return (
        <div style={{ maxWidth: 720, margin: '2rem auto 5rem', padding: '0 1.5rem' }}>
            <Breadcrumb
                items={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Chuyến đi', to: '/my-bookings' },
                    { label: `Đánh giá #${bookingCode}` },
                ]}
            />

            <div style={{ background: '#ffffff', padding: '2rem 2.5rem', borderRadius: '20px', border: '1px solid #EBEBEB', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)', maxWidth: '600px', margin: '0 auto' }}>
                <h4 style={{ margin: '0 0 20px 0', color: '#222222', fontSize: '1.45rem', fontWeight: 800 }}>Đánh giá kỳ lưu trú của bạn</h4>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
                    <img src={roomImage} alt={booking?.roomName || 'Phòng'} style={{ width: '72px', height: '72px', borderRadius: '12px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 700, color: '#FF385C', backgroundColor: '#FFF0F3', padding: '3px 10px', borderRadius: '999px', marginBottom: '6px' }}>
                            Đơn #{booking?.code || bookingCode} {booking?.roomId ? `· Phòng ${booking.roomId}` : ''}
                        </div>
                        <h5 style={{ margin: '0 0 2px 0', fontSize: '1rem', fontWeight: 700, color: '#222222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {booking?.roomName || 'Phòng ODauDay Stay'}
                        </h5>
                        <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B' }}>
                            {booking?.propertyName || 'ODauDay Stay'} · {stayDate}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '12px 16px', background: '#FFFBEB', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                        {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled = star <= activeStar;
                            return (
                                <span
                                    key={star}
                                    style={{
                                        fontSize: '36px',
                                        cursor: 'pointer',
                                        color: isFilled ? '#FFB400' : '#E2E8F0',
                                        filter: isFilled ? 'drop-shadow(0 2px 6px rgba(255, 180, 0, 0.45))' : 'none',
                                        transition: 'transform 0.15s ease, color 0.15s ease',
                                        userSelect: 'none',
                                        lineHeight: 1,
                                    }}
                                    onMouseEnter={(e) => { setHoverRating(star); e.currentTarget.style.transform = 'scale(1.2)'; }}
                                    onMouseLeave={(e) => { setHoverRating(0); e.currentTarget.style.transform = 'scale(1)'; }}
                                    onClick={() => setRating(star)}
                                >
                                    ★
                                </span>
                            );
                        })}
                        <div style={{ marginLeft: '10px' }}>
                            <div style={{ fontSize: '0.95rem', color: '#1E293B', fontWeight: 800 }}>
                                {activeStar} / 5 sao
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: ratingLabels[activeStar]?.color }}>
                                {ratingLabels[activeStar]?.text}
                            </div>
                        </div>
                    </div>

                    <div style={{ width: '100%', marginBottom: '20px' }}>
                        <textarea
                            rows={4}
                            style={{ width: '100%', padding: '14px', border: '1px solid #CBD5E1', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }}
                            placeholder={`Chia sẻ trải nghiệm của bạn tại ${booking?.roomName || 'phòng này'}...`}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#64748B', marginBottom: '20px' }}>
                        <ShieldCheck style={{ fontSize: '1.1rem', color: '#059669', flexShrink: 0 }} />
                        <span>Đánh giá được xác thực sau kỳ nghỉ thực tế để bảo đảm sự chân thực và uy tín.</span>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '14px 24px',
                            background: isSubmitting ? '#E2E8F0' : 'linear-gradient(135deg, #FF385C 0%, #E61E4D 100%)',
                            color: isSubmitting ? '#94A3B8' : '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '1rem',
                            fontWeight: 700,
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            boxShadow: isSubmitting ? 'none' : '0 4px 14px rgba(255, 56, 92, 0.35)'
                        }}
                    >
                        {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                </form>
            </div>
        </div>
    );
}