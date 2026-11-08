// Airbnb-Inspired Booking Checkout Page (Standardized Components)
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { InputField, Button, Card, Badge, Breadcrumb } from '../../components';
import { formatVND } from '../../constants';
import { ChevronLeft, StarFill, CreditCard, CashCoin, ShieldCheck, CalendarCheck, CheckCircleFill } from 'react-bootstrap-icons';
import { stayApi } from '../../api/stayApi';
import { Booking } from '../../data';

import PaymentWaitingPage from './PaymentWaitingPage';
import BookingFailedPage, { FailedPaymentData } from './BookingFailedPage';

interface BankApiItem {
    id: number;
    name: string;
    code: string;
    shortName: string;
    logo: string;
}

export default function BookingQuotePage() {
    const [searchParams] = useSearchParams();
    const { store, currentUser, addToast } = useStore();
    const navigate = useNavigate();

    const propertyId = Number(searchParams.get('propertyId')) || 1;
    const roomId = Number(searchParams.get('roomId')) || 1;
    const rawCheckIn = searchParams.get('in') || '2026-11-04';
    const rawCheckOut = searchParams.get('out') || '2026-11-05';
    const guests = searchParams.get('guests') || '1';

    // If checkOut <= checkIn, adjust checkOut to next day so at least 1 night stay is valid
    const checkIn = rawCheckIn;
    let checkOut = rawCheckOut;
    if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
        const d = new Date(checkIn);
        d.setDate(d.getDate() + 1);
        checkOut = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    const [guestName, setGuestName] = useState(currentUser?.fullName || 'Khách thuê');
    const [guestPhone, setGuestPhone] = useState(currentUser?.phone || '0900000003');
    const [guestEmail, setGuestEmail] = useState(currentUser?.email || 'guest@odauday.vn');

    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank'>('bank');
    const [bankSubMode, setBankSubMode] = useState<'QR_CODE' | 'BANK_REDIRECT'>('QR_CODE');
    const [banksList, setBanksList] = useState<BankApiItem[]>([]);
    const [selectedBankCode, setSelectedBankCode] = useState('MB');
    const [copiedField, setCopiedField] = useState('');
    const [isDownloadingQr, setIsDownloadingQr] = useState(false);

    // State chống gửi trùng giao dịch thanh toán
    const [isAlreadyPaid, setIsAlreadyPaid] = useState<boolean>(false);

    const [simulateOutcome, setSimulateOutcome] = useState<'SUCCESS' | 'FAILED'>('SUCCESS');
    const [processingState, setProcessingState] = useState<'IDLE' | 'WAITING_CONFIRM' | 'WAITING_REDIRECT'>('IDLE');
    const [failedData, setFailedData] = useState<FailedPaymentData | null>(null);

    useEffect(() => {
        fetch('https://api.vietqr.io/v2/banks')
            .then(res => res.json())
            .then(data => { if (data.code === '00' && data.data) setBanksList(data.data); })
            .catch(() => {});
    }, []);

    const property = store.getProperty(propertyId) || store.getProperty(1)!;
    const room = store.getAllRooms().find(r => r.id === roomId) || store.getAllRooms()[0];
    const quote = store.calculateQuote(room.id, checkIn, checkOut, guests);

    const nights = quote.nights || 1;
    const subtotal = quote.subtotal ?? (room.price * nights);
    const totalAmount = quote.total ?? subtotal;
    const depositAmount = Math.round(totalAmount * 0.3);
    const activePaymentAmount = paymentMethod === 'cod' ? depositAmount : totalAmount;
    const remainingAtHotel = paymentMethod === 'cod' ? (totalAmount - depositAmount) : 0;

    const selectedBankObj = banksList.find(b => b.code === selectedBankCode);
    const receiverAccount = {
        bankId: 'MB',
        bankName: 'Ngân hàng TMCP Quân đội (MB Bank)',
        accountNo: '0987654321',
        accountName: 'ODAUDAY STAY',
        content: paymentMethod === 'cod' ? `ODAUDAY STAY COC P${room.id}` : `ODAUDAY STAY P${room.id}`,
    };

    const vietQrUrl = `https://img.vietqr.io/image/${receiverAccount.bankId}-${receiverAccount.accountNo}-compact2.png?amount=${activePaymentAmount}&addInfo=${encodeURIComponent(receiverAccount.content)}&accountName=${encodeURIComponent(receiverAccount.accountName)}`;

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(''), 1800);
    };

    const handleDownloadQr = async () => {
        try {
            setIsDownloadingQr(true);
            const response = await fetch(vietQrUrl);
            if (!response.ok) throw new Error('Không thể tải mã QR');
            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `VietQR-${room.id}.png`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        } catch {
            window.open(vietQrUrl, '_blank');
            addToast('Đang mở ảnh QR trong tab mới để bạn tải và lưu thủ công.', 'info');
        } finally {
            setIsDownloadingQr(false);
        }
    };

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isAlreadyPaid) {
            addToast('Đơn đặt phòng này đã được ghi nhận thanh toán.', 'error');
            return;
        }

        if (!quote.success) {
            addToast(quote.message || 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm!', 'error');
            return;
        }

        // 1. KÍCH HOẠT MÀN HÌNH CHỜ NGAY KHI BẤM NÚT
        if (paymentMethod === 'bank' && bankSubMode === 'BANK_REDIRECT') {
            setProcessingState('WAITING_REDIRECT');
        } else {
            setProcessingState('WAITING_CONFIRM');
        }

        const dbMethod = paymentMethod === 'cod' ? 'CASH' : 'BANK_TRANSFER';
        const subChannelLabel = bankSubMode === 'QR_CODE' ? 'Quét mã VietQR' : `Chuyển hướng (${selectedBankObj?.shortName || selectedBankCode})`;
        const txnCode = 'TXN-' + Math.floor(100000 + Math.random() * 900000);

        // 2. TẠO ĐỘ TRỄ 2 GIÂY ĐỂ HIỂN THỊ ANIMATION CHỜ
        setTimeout(async () => {
            // 3. XỬ LÝ NẾU NGƯỜI DÙNG BẤM NÚT TEST "FAILED"
            if (simulateOutcome === 'FAILED') {
                setProcessingState('IDLE'); // Tắt màn hình chờ
                setFailedData({
                    transactionCode: txnCode,
                    propertyName: property.name,
                    roomName: room.name,
                    checkIn,
                    checkOut,
                    nights,
                    guests: Number(guests) || 1,
                    guestName,
                    guestPhone,
                    dbMethod,
                    subChannel: subChannelLabel,
                    amount: activePaymentAmount,
                });
                return; // Dừng hàm, hiển thị component BookingFailedPage
            }

            // 4. LUỒNG THÀNH CÔNG THỰC TẾ
            try {
                // Chuẩn bị payload chuẩn khớp với backend
                const bookingPayload: Partial<Booking> = {
                    roomId: room.id,
                    propertyId: property.id,
                    propertyName: property.name,
                    roomName: room.name,
                    checkIn,
                    checkOut,
                    nights,
                    guests: Number(guests) || 1,
                    guestUsername: currentUser?.username || 'guest_user',
                    guestName,
                    guestPhone,
                    guestEmail,
                    pricePerNight: subtotal / nights,
                    subtotal,
                    serviceFee: 0,
                    total: totalAmount,
                    paymentMethod: dbMethod,
                    status: 'PENDING'
                };

                // GỌI TRỰC TIẾP API XUỐNG BACKEND THAY VÌ CHỈ LƯU STORE
                const apiRes = await stayApi.createBooking(bookingPayload);

                if (!apiRes.success || !apiRes.data) {
                    addToast(apiRes.message || 'Lỗi đặt phòng từ máy chủ', 'error');
                    setProcessingState('IDLE');
                    return;
                }

                // Dữ liệu booking thực tế trả về từ Backend (đã có id và code tự generate)
                const realBooking = apiRes.data;

                // Đồng bộ ngược lại vào Store cục bộ để giao diện không bị giật
                store.syncBookingFromApi(realBooking);

                setIsAlreadyPaid(true);
                addToast(paymentMethod === 'cod' ? 'Xác nhận đặt cọc 30% thành công!' : 'Đặt phòng thành công!', 'success');

                const params = new URLSearchParams({
                    code: realBooking.code, // Lấy mã đơn thật từ DB
                    txn: txnCode,
                    method: dbMethod,
                    channel: subChannelLabel,
                    amount: String(activePaymentAmount),
                });
                navigate(`/booking-success?${params.toString()}`);
            } catch (err) {
                console.error('Error creating booking:', err);
                setProcessingState('IDLE');
                addToast('Có lỗi xảy ra kết nối với máy chủ khi xử lý đơn.', 'error');
            }
        }, 2000); // 2000 milliseconds = 2 giây
    };

    // Màn hình chờ chuyển hướng cổng thanh toán
    if (processingState !== 'IDLE') {
        return (
            <PaymentWaitingPage
                isRedirect={processingState === 'WAITING_REDIRECT'}
                targetBankName={selectedBankObj?.shortName || selectedBankCode}
                isDeposit={paymentMethod === 'cod'}
                amount={activePaymentAmount}
            />
        );
    }

    // Màn hình Giao dịch thất bại (Click nút Thử lại sẽ gọi onRetry = setFailedData(null) để cho thanh toán lại)
    if (failedData) {
        return <BookingFailedPage data={failedData} onRetry={() => setFailedData(null)} />;
    }

    return (
        <div style={{ maxWidth: 1080, margin: '2rem auto 4rem', padding: '0 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Button variant="outline" size="sm" icon={<ChevronLeft />} onClick={() => navigate(-1)} />
                <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>Yêu cầu đặt phòng / chỗ ở</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(340px, 400px)', gap: '2.5rem', alignItems: 'start' }}>
                    {/* CỘT TRÁI */}
                    <div>
                        <Card title="Thông tin người đại diện đặt phòng" style={{ marginBottom: '1.75rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <InputField id="name" label="Họ và tên" required value={guestName} onChange={e => setGuestName(e.target.value)} />
                                <InputField id="phone" label="Số điện thoại di động" required value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
                            </div>
                            <InputField id="email" type="email" label="Email nhận phiếu xác nhận" required value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
                        </Card>

                        <Card title="Phương thức thanh toán" style={{ marginBottom: '1.75rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

                                {/* Selectable Card: Thanh toán COD */}
                                <label
                                    onClick={() => setPaymentMethod('cod')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '1rem',
                                        padding: '1.25rem',
                                        border: paymentMethod === 'cod' ? '2px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
                                        borderRadius: 14,
                                        cursor: 'pointer',
                                        background: paymentMethod === 'cod' ? 'var(--color-primary-soft)' : 'var(--color-bg-surface)',
                                        boxShadow: paymentMethod === 'cod' ? '0 4px 12px rgba(225, 29, 72, 0.08)' : 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                        <input type="radio" name="payMethod" checked={paymentMethod === 'cod'} onChange={() => {}} style={{ display: 'none' }} />
                                        <CashCoin style={{ fontSize: '1.6rem', color: paymentMethod === 'cod' ? 'var(--color-primary)' : 'var(--color-success)', flexShrink: 0, marginTop: 2, transition: 'color 0.2s' }} />
                                        <div>
                                            <strong style={{ display: 'block', fontSize: '0.98rem', color: paymentMethod === 'cod' ? 'var(--color-danger)' : 'var(--color-text-primary)', marginBottom: 4 }}>Thanh toán tiền mặt khi nhận phòng (COD / Cọc 30%)</strong>
                                            <span style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', lineHeight: 1.4, display: 'block' }}>Đặt cọc trước để giữ chỗ, thanh toán phần còn lại khi nhận phòng.</span>
                                        </div>
                                    </div>
                                    {paymentMethod === 'cod' && <CheckCircleFill style={{ color: 'var(--color-primary)', fontSize: '1.2rem', flexShrink: 0 }} />}
                                </label>

                                {/* Selectable Card: Thanh toán Ngân hàng */}
                                <label
                                    onClick={() => setPaymentMethod('bank')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '1rem',
                                        padding: '1.25rem',
                                        border: paymentMethod === 'bank' ? '2px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
                                        borderRadius: 14,
                                        cursor: 'pointer',
                                        background: paymentMethod === 'bank' ? 'var(--color-primary-soft)' : 'var(--color-bg-surface)',
                                        boxShadow: paymentMethod === 'bank' ? '0 4px 12px rgba(225, 29, 72, 0.08)' : 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                        <input type="radio" name="payMethod" checked={paymentMethod === 'bank'} onChange={() => {}} style={{ display: 'none' }} />
                                        <CreditCard style={{ fontSize: '1.6rem', color: paymentMethod === 'bank' ? 'var(--color-primary)' : 'var(--color-text-primary)', flexShrink: 0, marginTop: 2, transition: 'color 0.2s' }} />
                                        <div>
                                            <strong style={{ display: 'block', fontSize: '0.98rem', color: paymentMethod === 'bank' ? 'var(--color-danger)' : 'var(--color-text-primary)', marginBottom: 4 }}>Chuyển khoản qua mã QR hoặc Ngân hàng (Thanh toán Full)</strong>
                                            <span style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', lineHeight: 1.4, display: 'block' }}>Hoàn tất thanh toán trực tuyến an toàn.</span>
                                        </div>
                                    </div>
                                    {paymentMethod === 'bank' && <CheckCircleFill style={{ color: 'var(--color-primary)', fontSize: '1.2rem', flexShrink: 0 }} />}
                                </label>
                            </div>

                            {/* Hộp QR & Ngân hàng */}
                            <div style={{ marginTop: '1.5rem', padding: '1.25rem', borderRadius: 14, border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-app)' }}>
                                <div style={{ display: 'flex', background: 'var(--color-border-subtle)', padding: 4, borderRadius: 10, marginBottom: '1.15rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setBankSubMode('QR_CODE')}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: 8,
                                            border: 'none',
                                            fontSize: '0.84rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            backgroundColor: bankSubMode === 'QR_CODE' ? 'var(--color-bg-surface)' : 'transparent',
                                            color: 'var(--color-text-primary)',
                                            boxShadow: bankSubMode === 'QR_CODE' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Quét mã VietQR
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBankSubMode('BANK_REDIRECT')}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: 8,
                                            border: 'none',
                                            fontSize: '0.84rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            backgroundColor: bankSubMode === 'BANK_REDIRECT' ? 'var(--color-bg-surface)' : 'transparent',
                                            color: 'var(--color-text-primary)',
                                            boxShadow: bankSubMode === 'BANK_REDIRECT' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Chuyển hướng Ngân hàng
                                    </button>
                                </div>

                                {bankSubMode === 'QR_CODE' ? (
                                    <div>
                                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                            <div
                                                style={{
                                                    display: 'inline-block',
                                                    background: 'var(--color-bg-surface)',
                                                    padding: '0.85rem',
                                                    borderRadius: 12,
                                                    border: '1px solid var(--color-bg-muted)',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                                }}
                                            >
                                                <img
                                                    src={vietQrUrl}
                                                    alt="VietQR"
                                                    style={{
                                                        width: 190,
                                                        height: 'auto',
                                                        display: 'block',
                                                        margin: '0 auto 0.65rem',
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleDownloadQr}
                                                    disabled={isDownloadingQr}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.4rem 0.85rem',
                                                        borderRadius: 6,
                                                        backgroundColor: 'var(--color-primary-soft)',
                                                        color: 'var(--color-primary)',
                                                        fontSize: '0.76rem',
                                                        fontWeight: 600,
                                                        border: '1px solid var(--color-primary-border)',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    {isDownloadingQr ? 'Đang tải...' : '⬇ Tải ảnh mã QR thanh toán'}
                                                </button>
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                background: 'var(--color-bg-surface)',
                                                borderRadius: 10,
                                                padding: '0.85rem 1rem',
                                                border: '1px solid var(--color-border-subtle)',
                                                fontSize: '0.84rem',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Chủ TK:</span>
                                                <strong style={{ color: 'var(--color-text-primary)' }}>{receiverAccount.accountName}</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Ngân hàng:</span>
                                                <strong style={{ color: 'var(--color-text-primary)' }}>{receiverAccount.bankName}</strong>
                                            </div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginBottom: 6,
                                                }}
                                            >
                                                <span style={{ color: 'var(--color-text-muted)' }}>STK:</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <strong style={{ color: 'var(--color-text-primary)' }}>{receiverAccount.accountNo}</strong>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(receiverAccount.accountNo, 'STK')}
                                                        style={{
                                                            fontSize: '0.72rem',
                                                            padding: '2px 8px',
                                                            borderRadius: 4,
                                                            border: '1px solid var(--color-border-strong)',
                                                            background: 'var(--color-bg-app)',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        {copiedField === 'STK' ? 'Đã chép' : 'Sao chép'}
                                                    </button>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Nội dung:</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <strong style={{ color: 'var(--color-primary)' }}>{receiverAccount.content}</strong>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(receiverAccount.content, 'CONTENT')}
                                                        style={{
                                                            fontSize: '0.72rem',
                                                            padding: '2px 8px',
                                                            borderRadius: 4,
                                                            border: '1px solid var(--color-border-strong)',
                                                            background: 'var(--color-bg-app)',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        {copiedField === 'CONTENT' ? 'Đã chép' : 'Sao chép'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                                            Chọn ngân hàng bạn muốn sử dụng để tiếp tục thanh toán.
                                        </div>
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                                gap: '0.65rem',
                                                maxHeight: '260px',
                                                overflowY: 'auto',
                                                overflowX: 'hidden',
                                                padding: '2px 6px 2px 2px',
                                                minWidth: 0,
                                                alignItems: 'stretch',
                                            }}
                                        >
                                            {banksList.map(bank => {
                                                const isSelected = selectedBankCode === bank.code;
                                                return (
                                                    <button
                                                        key={bank.id}
                                                        type="button"
                                                        onClick={() => setSelectedBankCode(bank.code)}
                                                        style={{
                                                            padding: '0.65rem 0.7rem',
                                                            minWidth: 0,
                                                            minHeight: 58,
                                                            borderRadius: 12,
                                                            border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
                                                            backgroundColor: isSelected ? 'var(--color-primary-soft)' : 'var(--color-bg-surface)',
                                                            textAlign: 'left',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.65rem',
                                                        }}
                                                    >
                                                        {bank.logo ? (
                                                            <>
                                                                <img
                                                                    src={bank.logo}
                                                                    alt={bank.shortName}
                                                                    style={{
                                                                        width: 42,
                                                                        height: 30,
                                                                        objectFit: 'contain',
                                                                        flex: '0 0 42px',
                                                                        display: 'block',
                                                                        background: 'var(--color-bg-surface)',
                                                                        borderRadius: 7,
                                                                        padding: 4,
                                                                        border: '1px solid var(--color-border-subtle)',
                                                                    }}
                                                                    onError={(e) => {
                                                                        const image = e.currentTarget;
                                                                        image.style.display = 'none';
                                                                        const fallback = image.nextElementSibling as HTMLElement | null;
                                                                        if (fallback) fallback.style.display = 'flex';
                                                                    }}
                                                                />
                                                                <div style={{ display: 'none', width: 42, height: 30, flex: '0 0 42px', alignItems: 'center', justifyContent: 'center', borderRadius: 7, background: 'var(--color-bg-muted)', color: 'var(--color-text-secondary)', fontSize: '0.68rem', fontWeight: 800, border: '1px solid var(--color-border-subtle)' }}>
                                                                    {bank.code}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div style={{ width: 42, height: 30, flex: '0 0 42px', background: 'var(--color-border-subtle)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                                                                {bank.code}
                                                            </div>
                                                        )}
                                                        <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                                            <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {bank.shortName}
                                                            </div>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {bank.name}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '0.85rem', padding: '0.75rem 1rem', background: 'var(--color-bg-app)', border: '1px dashed var(--color-border-strong)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Mô phỏng Test:</span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setSimulateOutcome('SUCCESS')}
                                        style={{
                                            padding: '0.35rem 0.75rem',
                                            borderRadius: 6,
                                            border: '1px solid var(--color-success)',
                                            background: simulateOutcome === 'SUCCESS' ? 'var(--color-success)' : 'transparent',
                                            color: simulateOutcome === 'SUCCESS' ? 'var(--color-bg-surface)' : 'var(--color-success)',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        ✓ PAID
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSimulateOutcome('FAILED')}
                                        style={{
                                            padding: '0.35rem 0.75rem',
                                            borderRadius: 6,
                                            border: '1px solid var(--color-danger)',
                                            background: simulateOutcome === 'FAILED' ? 'var(--color-danger)' : 'transparent',
                                            color: simulateOutcome === 'FAILED' ? 'var(--color-bg-surface)' : 'var(--color-danger)',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        ✕ FAILED
                                    </button>
                                </div>
                            </div>
                        </Card>

                        <Card title="Chính sách hủy phòng">
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>Hủy miễn phí trước 48 giờ so với thời điểm nhận phòng. Sau thời gian này, việc hủy phòng sẽ tuân theo thỏa thuận trực tiếp cùng chủ nhà.</p>
                        </Card>

                        <div style={{ marginTop: '2rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
                                Bằng cách nhấn xác nhận ở cột bên phải, bạn đồng ý với Nội quy nhà của Chủ nhà, Các quy tắc nền tảng của ODauDay Stay và Điều khoản dịch vụ.
                            </p>
                        </div>
                    </div>

                    {/* CỘT PHẢI */}
                    <aside style={{ position: 'sticky', top: '6rem' }}>
                        <Card variant="elevated">
                            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '1.25rem', marginBottom: '1rem' }}>
                                <img src={property.image} alt={property.name} style={{ width: 92, height: 84, borderRadius: 10, objectFit: 'cover' }} />
                                <div>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block' }}>{property.type} · {property.city}</span>
                                    <strong style={{ fontSize: '0.98rem', display: 'block', margin: '0.2rem 0' }}>{property.name}</strong>
                                    <span style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', display: 'block' }}>Hạng phòng: {room.name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', marginTop: 4 }}>
                                        <StarFill style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }} />
                                        <strong>{property.rating ? property.rating.toFixed(2) : '4.80'}</strong>
                                        <span style={{ color: 'var(--color-text-muted)' }}>(18 đánh giá)</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div
                                    title="ODauDay hướng đến bảo vệ quyền lợi khách hàng. Các quyền lợi và điều kiện hỗ trợ được áp dụng theo chính sách đặt phòng."
                                    role="note"
                                    aria-label="Bảo vệ quyền lợi khách hàng"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '7px 12px',
                                        borderRadius: 999,
                                        background: 'linear-gradient(135deg, var(--color-success-bg), var(--color-success-border))',
                                        border: '1px solid var(--color-success-border)',
                                        color: 'var(--color-success)',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        cursor: 'help',
                                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <ShieldCheck style={{ fontSize: '1rem', color: 'var(--color-success)', flexShrink: 0 }} />
                                    <span>Bảo vệ quyền lợi khách hàng</span>
                                    <span style={{ width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--color-success-border)', color: 'var(--color-success)', fontSize: 11, fontWeight: 800 }}>i</span>
                                </div>
                            </div>

                            <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, var(--color-bg-app) 0%, var(--color-bg-muted) 55%, var(--color-primary-soft) 100%)', borderRadius: 16, padding: '1rem', border: '1px solid var(--color-border-subtle)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: '0.9rem' }}>
                                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>Thông tin kỳ nghỉ</strong>
                                    <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--color-danger)', background: 'rgba(255,255,255,0.8)', border: '1px solid var(--color-primary-border)', borderRadius: 999, padding: '4px 8px' }}>YOUR STAY</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(226,232,240,0.9)', borderRadius: 12, padding: '0.75rem' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <span style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.72rem', marginBottom: 4 }}>NHẬN PHÒNG</span>
                                        <strong style={{ display: 'block', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{checkIn}</strong>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--color-primary)', fontSize: '0.68rem', fontWeight: 700 }}>
                                        <span style={{ width: 28, height: 1, background: 'var(--color-primary-border)' }} />
                                        <span style={{ whiteSpace: 'nowrap', margin: '4px 0' }}>{nights} ĐÊM</span>
                                        <span style={{ width: 28, height: 1, background: 'var(--color-primary-border)' }} />
                                    </div>
                                    <div style={{ minWidth: 0, textAlign: 'right' }}>
                                        <span style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.72rem', marginBottom: 4 }}>TRẢ PHÒNG</span>
                                        <strong style={{ display: 'block', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{checkOut}</strong>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: '0.75rem', padding: '0.2rem 0.1rem 0' }}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>Số lượng khách</span>
                                    <strong style={{ color: 'var(--color-text-primary)' }}>{guests} khách <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>/ tối đa {room.capacity}</span></strong>
                                </div>
                            </div>

                            <h3 style={{ fontSize: '1.02rem', fontWeight: 750, margin: '0 0 0.8rem', color: 'var(--color-text-primary)' }}>Chi tiết thanh toán</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}><span>Giá phòng · {nights} đêm</span><strong style={{ color: 'var(--color-text-secondary)' }}>{formatVND(subtotal)}</strong></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}><span>Phí dịch vụ</span><strong style={{ color: 'var(--color-success)' }}>Miễn phí</strong></div>
                                {paymentMethod === 'cod' ? (
                                    <div style={{ marginTop: 4, padding: '0.85rem 0.9rem', borderRadius: 12, background: 'linear-gradient(120deg, var(--color-warning-bg), var(--color-primary-soft))', border: '1px solid var(--color-warning)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-warning)' }}>Cần đặt cọc ngay (30%)</span>
                                            <strong style={{ fontSize: '1.12rem', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>{formatVND(depositAmount)}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.78rem', color: 'var(--color-warning)', marginTop: 7 }}>
                                            <span>Còn lại khi nhận phòng (70%)</span><strong>{formatVND(remainingAtHotel)}</strong>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ marginTop: 4, padding: '0.85rem 0.9rem', borderRadius: 12, background: 'linear-gradient(120deg, var(--color-primary-soft), var(--color-primary-soft))', border: '1px solid var(--color-primary-border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-danger)' }}>Tổng thanh toán</span>
                                            <strong style={{ fontSize: '1.12rem', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>{formatVND(totalAmount)}</strong>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '1.25rem' }}>
                                <Button type="submit" variant="primary" size="lg" icon={<CalendarCheck />} style={{ width: '100%', justifyContent: 'center' }}>
                                    {paymentMethod === 'cod' ? 'Xác nhận đặt cọc 30%' : 'Xác nhận thanh toán'}
                                </Button>
                            </div>
                        </Card>
                    </aside>
                </div>
            </form>
        </div>
    );
}