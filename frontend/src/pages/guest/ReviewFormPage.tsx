// Airbnb-Inspired Review Form Page (TypeScript)
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { Breadcrumb } from '../../components/UI';
import { ShieldCheck, StarFill, CameraFill } from 'react-bootstrap-icons';
import { stayApi } from '../../api/stayApi';
import { Property } from '../../data';

export default function ReviewFormPage() {
    const [searchParams] = useSearchParams();
    const { store, currentUser, addToast } = useStore();
    const navigate = useNavigate();

    const bookingCode = searchParams.get('bookingCode') || 'ODD-DEMO-0001';
    const booking = store.getBooking(bookingCode) || store.getAllBookings()[0];
    const targetPropertyId = booking?.propertyId || 1;

    // Thông tin Chỗ ở lấy từ store & API thực tế
    const [property, setProperty] = useState<Property | null>(() => store.getProperty(targetPropertyId));

    useEffect(() => {
        if (targetPropertyId) {
            stayApi.getProperty(targetPropertyId).then(res => {
                if (res.success && res.data) {
                    setProperty(res.data);
                }
            }).catch(() => {});
        }
    }, [targetPropertyId]);

    // 1. Ánh xạ số sao và số lượt đánh giá thực tế từ API (loại bỏ hardcode)
    const propertyRating = property?.averageRating ?? property?.rating ?? null;
    const reviewCount = property?.reviewsCount ?? property?.reviewCount ?? 0;
    // 3. Logic điều kiện: Nếu phòng chưa có đánh giá nào (rating = 0 hoặc null) thì ẩn sao và hiện "Mới"
    const hasRating = propertyRating !== null && propertyRating > 0 && reviewCount > 0;

    // Kiểm tra đơn đã được đánh giá hay chưa
    const isReviewed = Boolean(
        booking?.isReviewed === true ||
        (booking as any)?.is_reviewed === true ||
        (booking as any)?.is_reviewed === 1 ||
        store.isBookingReviewed(bookingCode)
    );

    // Trạng thái Form
    const [rating, setRating] = useState<number>(5);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // 4 & 5. Quản lý đính kèm Media (ảnh/video) và xem trước (preview thumbnail)
    const [mediaFiles, setMediaFiles] = useState<Array<{ file: File; previewUrl: string; type: 'image' | 'video' }>>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newMedia = Array.from(files).map(file => {
            const previewUrl = URL.createObjectURL(file);
            const type = file.type.startsWith('video/') ? ('video' as const) : ('image' as const);
            return { file, previewUrl, type };
        });

        setMediaFiles(prev => [...prev, ...newMedia]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveMedia = (indexToRemove: number) => {
        setMediaFiles(prev => {
            const updated = [...prev];
            const removed = updated.splice(indexToRemove, 1);
            if (removed[0]?.previewUrl) {
                URL.revokeObjectURL(removed[0].previewUrl);
            }
            return updated;
        });
    };

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
        if (isReviewed) {
            addToast('Chuyến đi này đã được đánh giá.', 'info');
            navigate('/my-bookings');
        }
    }, [isReviewed, navigate, addToast]);

    // HÀM SUBMIT SỬ DỤNG FETCH ĐỂ GỌI API THỰC TẾ
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isReviewed || isSubmitting) return;

        setIsSubmitting(true);

        try {
            const reviewPayload = {
                bookingCode,
                propertyId: targetPropertyId,
                rating,
                comment,
                guestUsername: currentUser?.username || 'guest_user',
                guestName: currentUser?.fullName || 'Khách Hàng Ẩn Danh'
            };

            // Gọi qua tầng dịch vụ API tập trung stayApi.submitReview (chuẩn Base URL / Interceptors)
            const response = await stayApi.submitReview(reviewPayload);

            if (response.success) {
                // Đánh dấu vào store cục bộ để UI biết đơn này đã được đánh giá
                const localRes = store.submitReview(reviewPayload);

                if (localRes.success) {
                    addToast('Cảm ơn bạn! Đánh giá đã được gửi thành công.', 'success');
                    // Chuyển hướng về trang chi tiết chỗ ở kèm highlight và cuộn tới mục #reviews
                    navigate(`/property/${targetPropertyId}?highlight=${bookingCode}#reviews`);
                }
            } else {
                throw new Error(response.message || 'Không thể gửi đánh giá, vui lòng thử lại sau.');
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
    if (isReviewed) return null;

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

                {/* THẺ HIỂN THỊ PHÒNG (PROPERTY CARD) VỚI RATING THỰC TẾ */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', backgroundColor: 'var(--color-bg-app)', borderRadius: '14px', border: '1px solid var(--color-border-subtle)', marginBottom: '24px' }}>
                    <img src={roomImage} alt={booking?.roomName || 'Phòng'} style={{ width: '72px', height: '72px', borderRadius: '12px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-soft)', padding: '3px 10px', borderRadius: '999px' }}>
                                Đơn #{booking?.code || bookingCode} {booking?.roomId ? `· Phòng ${booking.roomId}` : ''}
                            </span>

                            {/* 1, 2, 3: Ánh xạ điểm thực tế, sao vàng #FFD700, hoặc chữ "Mới" nếu chưa có đánh giá */}
                            {hasRating ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                    <StarFill style={{ color: '#FFD700', fontSize: '0.85rem' }} />
                                    <span>{propertyRating?.toFixed(1)}</span>
                                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 500, fontSize: '0.76rem' }}>
                                        ({reviewCount})
                                    </span>
                                </span>
                            ) : (
                                <span style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-success)', backgroundColor: 'var(--color-success-bg)', padding: '2px 8px', borderRadius: '6px' }}>
                                    Mới
                                </span>
                            )}
                        </div>

                        <h5 style={{ margin: '0 0 2px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {booking?.roomName || 'Phòng ODauDay Stay'}
                        </h5>
                        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                            {booking?.propertyName || property?.name || 'ODauDay Stay'} · {stayDate}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* BỘ CHỌN SỐ SAO VỚI TÔNG MÀU VÀNG TƯƠI #FFD700 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '12px 16px', background: 'var(--color-star-bg)', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                        {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled = star <= activeStar;
                            return (
                                <span
                                    key={star}
                                    style={{
                                        fontSize: '36px',
                                        cursor: 'pointer',
                                        color: isFilled ? '#FFD700' : 'var(--color-border-strong)',
                                        filter: isFilled ? 'drop-shadow(0 2px 6px rgba(255, 215, 0, 0.45))' : 'none',
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

                    <div style={{ width: '100%', marginBottom: '16px' }}>
                        <textarea
                            rows={4}
                            style={{ width: '100%', padding: '14px', border: '1px solid var(--color-border-strong)', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }}
                            placeholder={`Chia sẻ trải nghiệm của bạn tại ${booking?.roomName || 'phòng này'}...`}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            required
                        />
                    </div>

                    {/* 4 & 5: KHU VỰC ĐÍNH KÈM HÌNH ẢNH / VIDEO VÀ LƯỚI PREVIEW THUMBNAIL */}
                    <div style={{ marginBottom: '20px' }}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            style={{ display: 'none' }}
                            onChange={handleFilesSelected}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '10px 18px',
                                borderRadius: 10,
                                border: '1.5px dashed var(--color-primary)',
                                background: 'var(--color-primary-soft)',
                                color: 'var(--color-primary)',
                                fontSize: '0.88rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                            <CameraFill style={{ fontSize: '1.15rem' }} />
                            <span>Thêm hình ảnh / video</span>
                        </button>

                        {/* LƯỚI ẢNH THU NHỎ (THUMBNAIL GRID PREVIEW) */}
                        {mediaFiles.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
                                {mediaFiles.map((item, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            position: 'relative',
                                            width: 80,
                                            height: 80,
                                            borderRadius: 10,
                                            overflow: 'hidden',
                                            border: '1px solid var(--color-border-subtle)',
                                            background: 'var(--color-bg-muted)',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                        }}
                                    >
                                        {item.type === 'video' ? (
                                            <video
                                                src={item.previewUrl}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <img
                                                src={item.previewUrl}
                                                alt={`Tệp xem trước ${idx + 1}`}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMedia(idx)}
                                            style={{
                                                position: 'absolute',
                                                top: 4,
                                                right: 4,
                                                width: 20,
                                                height: 20,
                                                borderRadius: '50%',
                                                background: 'rgba(0, 0, 0, 0.65)',
                                                color: '#fff',
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                padding: 0,
                                                lineHeight: 1,
                                            }}
                                            title="Xóa tệp này"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
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
