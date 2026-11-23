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
        <div style={{ maxWidth: 1760, margin: '4rem auto', padding: '0 2.5rem' }}>
            <div
                style={{
                    maxWidth: 540,
                    margin: '0 auto',
                    background: 'var(--color-bg-surface)',
                    padding: '3rem 2rem',
                    borderRadius: 18,
                    border: '1px solid var(--color-border-subtle)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                    textAlign: 'center',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            border: '4px solid var(--color-border-subtle)',
                            borderTopColor: 'var(--color-primary)',
                            borderRadius: '50%',
                        }}
                        className="animate-spin"
                    />
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