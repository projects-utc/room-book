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

    // Nhãn cảm xúc theo số sao (SPEC-FE-001)
    const ratingLabels: Record<number, { text: string; color: string }> = {
        1: { text: 'Cần cải thiện', color: 'var(--color-danger)' },
        2: { text: 'Tạm ổn', color: 'var(--color-warning)' },
        3: { text: 'Hài lòng', color: 'var(--color-warning)' },
        4: { text: 'Rất tốt', color: 'var(--color-success)' },
        5: { text: 'Tuyệt vời xuất sắc!', color: 'var(--color-primary)' },
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

            <div style={{ background: 'var(--color-bg-surface)', padding: '2rem 2.5rem', borderRadius: '20px', border: '1px solid var(--color-border-subtle)', boxShadow: 'var(--shadow-card)', maxWidth: '600px', margin: '0 auto' }}>
                <h4 style={{ margin: '0 0 20px 0', color: 'var(--color-text-primary)', fontSize: '1.45rem', fontWeight: 800 }}>Đánh giá kỳ lưu trú của bạn</h4>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', backgroundColor: 'var(--color-bg-app)', borderRadius: '14px', border: '1px solid var(--color-border-subtle)', marginBottom: '24px' }}>
                    <img src={roomImage} alt={booking?.roomName || 'Phòng'} style={{ width: '72px', height: '72px', borderRadius: '12px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-soft)', padding: '3px 10px', borderRadius: '999px', marginBottom: '6px' }}>
                            Đơn #{booking?.code || bookingCode} {booking?.roomId ? `· Phòng ${booking.roomId}` : ''}
                        </div>
                        <h5 style={{ margin: '0 0 2px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {booking?.roomName || 'Phòng ODauDay Stay'}
                        </h5>
                        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                            {booking?.propertyName || 'ODauDay Stay'} · {stayDate}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '12px 16px', background: 'var(--color-warning-bg)', borderRadius: '12px', border: '1px solid var(--color-warning-border)' }}>
                        {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled = star <= activeStar;
                            return (
                                <span
                                    key={star}
                                    style={{
                                        fontSize: '36px',
                                        cursor: 'pointer',
                                        color: isFilled ? 'var(--color-warning)' : 'var(--color-border-strong)',
                                        filter: isFilled ? 'drop-shadow(0 2px 6px rgba(245, 158, 11, 0.35))' : 'none',
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
                            <div style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)', fontWeight: 800 }}>
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
                            style={{ width: '100%', padding: '14px', border: '1px solid var(--color-border-strong)', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }}
                            placeholder={`Chia sẻ trải nghiệm của bạn tại ${booking?.roomName || 'phòng này'}...`}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                        <ShieldCheck style={{ fontSize: '1.1rem', color: 'var(--color-success)', flexShrink: 0 }} />
                        <span>Đánh giá được xác thực sau kỳ nghỉ thực tế để bảo đảm sự chân thực và uy tín.</span>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary btn-block btn-lg"
                    >
                        {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                </form>
            </div>
        </div>
    );
}