// Airbnb-Inspired Booking Success / Confirmation Page (TypeScript)
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { formatVND } from '../../constants';

export default function BookingSuccessPage() {
    const [searchParams] = useSearchParams();
    const { store } = useStore();
    const navigate = useNavigate();

    const code = searchParams.get('code') || 'ODD-DEMO-0002';
    const booking = store.getBooking(code) || store.getAllBookings()[0];

    // Nhận thêm thông tin giao dịch truyền từ BookingQuotePage qua URL
    const txnCode = searchParams.get('txn') || 'TXN-808384';
    const dbMethod = searchParams.get('method') || 'BANK_TRANSFER';
    const subChannel = searchParams.get('channel') || 'Quét mã VietQR';
    // Số tiền đã thanh toán lần này (truyền từ BookingQuotePage qua URL)
    const paidAmount = Number(searchParams.get('amount')) || booking?.total || 0;
    // Tổng tiền đơn đặt phòng (lấy từ booking store)
    const totalAmount = booking?.total || paidAmount;
    // Chỉ hiện "Còn lại" khi COD (đặt cọc 30%): paidAmount < totalAmount
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    return (
        <div style={{ maxWidth: 540, margin: '3.5rem auto 5rem', padding: '0 1.5rem' }}>
            <div
                style={{
                    background: '#ffffff',
                    padding: '2.25rem 2rem',
                    borderRadius: 18,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                    textAlign: 'center',
                }}
            >
                {/* Icon Check Xanh */}
                <div
                    style={{
                        width: 68,
                        height: 68,
                        borderRadius: '50%',
                        margin: '0 auto 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        fontWeight: 700,
                        backgroundColor: '#ECFDF5',
                        color: '#10B981',
                    }}
                >
                    ✓
                </div>

                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 700, color: '#1E293B' }}>
                    Thanh toán thành công!
                </h3>
                <p style={{ margin: '0 0 1.5rem', fontSize: '0.92rem', color: '#64748B', lineHeight: 1.5 }}>
                    Đơn #{booking?.code || code} đã hoàn tất{' '}
                    {dbMethod === 'CASH' ? 'đặt cọc 30% giữ chỗ' : 'thanh toán 100%'}. Phương thức thanh toán đã được khóa.
                </p>

                {/* Khung thông tin chi tiết đồng bộ với PaymentFailedScreen */}
                <div
                    style={{
                        background: '#F8FAFC',
                        borderRadius: 14,
                        padding: '1.25rem',
                        textAlign: 'left',
                        marginBottom: '1.5rem',
                        border: '1px solid #E2E8F0',
                        fontSize: '0.9rem',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: '#64748B' }}>Mã xác nhận đặt phòng:</span>
                        <strong style={{ color: '#1E293B', fontFamily: 'monospace' }}>
                            {booking?.code || code}
                        </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: '#64748B' }}>Mã giao dịch:</span>
                        <strong style={{ color: '#1E293B' }}>{txnCode}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: '#64748B' }}>Chỗ ở & Hạng phòng:</span>
                        <strong style={{ color: '#1E293B', textAlign: 'right' }}>
                            {booking?.propertyName || 'ODauDay Stay'} ({booking?.roomName || 'Phòng nghỉ'})
                        </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: '#64748B' }}>Thời gian lưu trú:</span>
                        <span style={{ color: '#1E293B', fontWeight: 600 }}>
              {booking?.checkIn} → {booking?.checkOut} ({booking?.nights} đêm)
            </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: '#64748B' }}>Người liên hệ:</span>
                        <span style={{ color: '#1E293B', fontWeight: 600 }}>
              {booking?.guestName} ({booking?.guestPhone})
            </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: '#64748B' }}>Phương thức (DB):</span>
                        <strong style={{ color: '#1E293B' }}>{dbMethod}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: '#64748B' }}>Kênh chi tiết:</span>
                        <span style={{ color: '#1E293B', fontWeight: 600 }}>{subChannel}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: '#64748B' }}>Trạng thái:</span>
                        <strong style={{ color: '#15803D' }}>PAID</strong>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px dashed #CBD5E1', margin: '0.85rem 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem' }}>
                        <strong style={{ color: '#1E293B' }}>Số tiền:</strong>
                        <strong style={{ color: '#FF385C' }}>{formatVND(paidAmount)}</strong>
                    </div>

                    {remainingAmount > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.84rem',
                                color: '#64748B',
                                marginTop: '0.4rem',
                            }}
                        >
                            <span>Còn lại thanh toán tại quầy ({Math.round((remainingAmount / totalAmount) * 100)}%):</span>
                            <strong>{formatVND(remainingAmount)}</strong>
                        </div>
                    )}
                </div>

                {/* Nút bấm đồng bộ kiểu dáng */}
                <button
                    type="button"
                    onClick={() => navigate('/my-bookings')}
                    style={{
                        width: '100%',
                        padding: '0.9rem 1.25rem',
                        backgroundColor: '#1E293B',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginBottom: '0.75rem',
                    }}
                >
                    Xem những đơn đã đặt
                </button>

                <button
                    type="button"
                    onClick={() => navigate('/')}
                    style={{
                        width: '100%',
                        padding: '0.75rem 1.25rem',
                        backgroundColor: 'transparent',
                        color: '#64748B',
                        border: '1px solid #E2E8F0',
                        borderRadius: 10,
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    Khám phá thêm chỗ ở
                </button>
            </div>
        </div>
    );
}