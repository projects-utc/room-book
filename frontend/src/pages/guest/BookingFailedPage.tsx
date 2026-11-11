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
                    background: 'var(--color-bg-surface)',
                    padding: '2.25rem 2rem',
                    borderRadius: 18,
                    border: '1px solid var(--color-border-subtle)',
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
                        backgroundColor: 'var(--color-danger-bg)',
                        color: 'var(--color-danger)',
                    }}
                >
                    ✕
                </div>

                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Giao dịch thất bại
                </h3>
                <p style={{ margin: '0 0 1.5rem', fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    Giao dịch chưa thành công do ngân hàng từ chối hoặc hết thời gian chờ. Bạn vui lòng thử lại hoặc chọn phương thức thanh toán khác.
                </p>

                <div
                    style={{
                        background: 'var(--color-bg-app)',
                        borderRadius: 14,
                        padding: '1.25rem',
                        textAlign: 'left',
                        marginBottom: '1.5rem',
                        border: '1px solid var(--color-border-subtle)',
                        fontSize: '0.9rem',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Mã giao dịch:</span>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{data.transactionCode}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Chỗ ở & Hạng phòng:</span>
                        <strong style={{ color: 'var(--color-text-primary)', textAlign: 'right' }}>
                            {data.propertyName} ({data.roomName})
                        </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Thời gian lưu trú:</span>
                        <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
              {data.checkIn} → {data.checkOut} ({data.nights} đêm)
            </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Người liên hệ:</span>
                        <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
              {data.guestName} ({data.guestPhone})
            </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Phương thức thanh toán:</span>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{data.dbMethod}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Kênh thanh toán:</span>
                        <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{data.subChannel}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Trạng thái:</span>
                        <strong style={{ color: 'var(--color-danger)' }}>FAILED</strong>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px dashed var(--color-border-strong)', margin: '0.85rem 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem' }}>
                        <strong style={{ color: 'var(--color-text-primary)' }}>Số tiền:</strong>
                        <strong style={{ color: 'var(--color-primary)' }}>{formatVND(data.amount)}</strong>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onRetry}
                    style={{
                        width: '100%',
                        padding: '0.9rem 1.25rem',
                        backgroundColor: 'var(--color-text-primary)',
                        color: 'var(--color-bg-surface)',
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