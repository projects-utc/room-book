import React from 'react';
import { formatVND } from '../../constants';

export interface PaymentWaitingPageProps {
    isRedirect: boolean;
    targetBankName: string;
    isDeposit: boolean;
    amount: number;
}

export default function PaymentWaitingPage({
                                                 isRedirect,
                                                 targetBankName,
                                                 isDeposit,
                                                 amount,
                                             }: PaymentWaitingPageProps) {
    return (
        <div style={{ maxWidth: 540, margin: '4rem auto', padding: '0 1.5rem' }}>
            <div
                style={{
                    background: 'var(--color-bg-surface)',
                    padding: '3rem 2rem',
                    borderRadius: 18,
                    border: '1px solid var(--color-border-subtle)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                    textAlign: 'center',
                }}
            >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    {isRedirect ? '📱' : '⏳'}
                </div>
                <h3 style={{ margin: '0 0 0.65rem', fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {isRedirect
                        ? `Đang kết nối tới ${targetBankName}...`
                        : 'Đang chờ hệ thống ngân hàng xác nhận giao dịch...'}
                </h3>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    Vui lòng không đóng trình duyệt. Hệ thống đang đối soát khoản{' '}
                    {isDeposit ? 'đặt cọc 30%' : 'thanh toán 100%'} trị giá{' '}
                    <strong style={{ color: 'var(--color-text-primary)' }}>{formatVND(amount)}</strong>.
                </p>
            </div>
        </div>
    );
}