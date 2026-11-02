import React from 'react';
import { formatVND } from '../../constants';

export interface FailedPaymentData {
    transactionCode: string;
    propertyName: string;
    roomName: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    guests: string | number;
    guestName: string;
    guestPhone: string;
    dbMethod: 'CASH' | 'BANK_TRANSFER';
    subChannel: string;
    amount: number;
}

export interface BookingFailedPageProps {
    data: FailedPaymentData;
    onRetry: () => void;
}

export default function BookingFailedPage({ data, onRetry }: BookingFailedPageProps) {
    return (
        <div style={{ maxWidth: 540, margin: '3.5rem auto', padding: '0 1.5rem' }}>
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
                        backgroundColor: '#FEF2F2',
                        color: '#EF4444',
                    }}
                >
                    ✕
                </div>

                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 700, color: '#1E293B' }}>
                    Giao dịch thất bại
                </h3>
                <p style={{ margin: '0 0 1.5rem', fontSize: '0.92rem', color: '#64748B', lineHeight: 1.5 }}>
                    Cổng thanh toán giả lập (Mock Payment) từ chối giao dịch. Bạn có thể thử lại hoặc đổi phương thức khác.
                </p>

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
                        <span style={{ color: '#64748B' }}>Mã giao dịch:</span>
                        <strong style={{ color: '#1E293B' }}>{data.transactionCode}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: '#64748B' }}>Chỗ ở & Hạng phòng:</span>
                        <strong style={{ color: '#1E293B', textAlign: 'right' }}>
                            {data.propertyName} ({data.roomName})
                        </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: '#64748B' }}>Thời gian lưu trú:</span>
                        <span style={{ color: '#1E293B', fontWeight: 600 }}>
              {data.checkIn} → {data.checkOut} ({data.nights} đêm)
            </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: '#64748B' }}>Người liên hệ:</span>
                        <span style={{ color: '#1E293B', fontWeight: 600 }}>
              {data.guestName} ({data.guestPhone})
            </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: '#64748B' }}>Phương thức (DB):</span>
                        <strong style={{ color: '#1E293B' }}>{data.dbMethod}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: '#64748B' }}>Kênh chi tiết:</span>
                        <span style={{ color: '#1E293B', fontWeight: 600 }}>{data.subChannel}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: '#64748B' }}>Trạng thái:</span>
                        <strong style={{ color: '#B91C1C' }}>FAILED</strong>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px dashed #CBD5E1', margin: '0.85rem 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem' }}>
                        <strong style={{ color: '#1E293B' }}>Số tiền:</strong>
                        <strong style={{ color: '#FF385C' }}>{formatVND(data.amount)}</strong>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onRetry}
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
                    }}
                >
                    Chọn lại phương thức thanh toán
                </button>
            </div>
        </div>
    );
}