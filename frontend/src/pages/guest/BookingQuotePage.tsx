// Airbnb-Inspired Booking Checkout Page (Standardized Components)
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { InputField, Button, Card, Alert, DateRangePicker, LoadingSpinner } from '../../components';
import { formatVND } from '../../constants';
import {
    ChevronLeft,
    StarFill,
    CreditCard,
    CashCoin,
    ShieldCheck,
    CalendarCheck,
    CheckCircleFill,
    PersonBadge,
    LockFill,
    Tag,
    ClockHistory,
    PencilSquare,
} from 'react-bootstrap-icons';
import { stayApi } from '../../api/stayApi';
import { Booking, Property, Room } from '../../data';
import PaymentWaitingPage from './PaymentWaitingPage';

interface BankApiItem {
    id: number;
    name: string;
    code: string;
    shortName: string;
}

const DEFAULT_BANKS: BankApiItem[] = [
    { id: 1, code: 'MB', shortName: 'MBBank', name: 'Ngân hàng TMCP Quân đội' },
    { id: 2, code: 'VCB', shortName: 'Vietcombank', name: 'Ngân hàng TMCP Ngoại thương Việt Nam' },
    { id: 3, code: 'TCB', shortName: 'Techcombank', name: 'Ngân hàng TMCP Kỹ thương Việt Nam' },
    { id: 4, code: 'BIDV', shortName: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
    { id: 5, code: 'ACB', shortName: 'ACB', name: 'Ngân hàng TMCP Á Châu' },
];

function formatFreeCancelDeadline(checkInStr: string): string {
    const parsed = new Date(`${checkInStr}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return 'trước 48 giờ so với thời điểm nhận phòng';
    parsed.setDate(parsed.getDate() - 2);
    const d = String(parsed.getDate()).padStart(2, '0');
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const y = parsed.getFullYear();
    return `trước 14:00 ngày ${d}/${m}/${y}`;
}

export default function BookingQuotePage() {
    const [searchParams] = useSearchParams();
    const { store, currentUser, addToast } = useStore();
    const navigate = useNavigate();
    const location = useLocation();

    const propertyId = Number(searchParams.get('propertyId')) || 1;
    const roomId = Number(searchParams.get('roomId')) || 1;

    const inParam = searchParams.get('in');
    const outParam = searchParams.get('out');

    useEffect(() => {
        if (!inParam || !outParam) {
            addToast('Vui lòng chọn ngày nhận và trả phòng trước khi tạo yêu cầu đặt phòng.', 'warn');
            const targetPropId = propertyId || 1;
            const targetRoomParam = roomId ? `?roomId=${roomId}` : '';
            navigate(`/property/${targetPropId}${targetRoomParam}`, { replace: true });
        }
    }, [inParam, outParam, propertyId, roomId, navigate, addToast]);

    const [checkIn, setCheckIn] = useState(inParam || '');
    const [checkOut, setCheckOut] = useState(outParam || '');
    const [guests, setGuests] = useState(searchParams.get('guests') || '1');
    const [editingStay, setEditingStay] = useState(false);

    const [guestName, setGuestName] = useState(currentUser?.fullName || '');
    const [guestPhone, setGuestPhone] = useState(currentUser?.phone || '');
    const [guestEmail, setGuestEmail] = useState(currentUser?.email || '');
    const [bookingForOther, setBookingForOther] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            addToast('Vui lòng đăng nhập hoặc đăng ký tài khoản để tiếp tục đặt phòng.', 'warn');
            navigate('/login', { state: { from: location }, replace: true });
        } else if (!bookingForOther) {
            setGuestName(prev => prev || currentUser.fullName || '');
            setGuestPhone(prev => prev || currentUser.phone || '');
            setGuestEmail(prev => prev || currentUser.email || '');
        }
    }, [currentUser, navigate, location, addToast, bookingForOther]);

    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank'>('bank');
    const [banksList, setBanksList] = useState<BankApiItem[]>(DEFAULT_BANKS);
    const [selectedBankCode, setSelectedBankCode] = useState('MB');
    const [promoInput, setPromoInput] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(null);
    const [promoLoading, setPromoLoading] = useState(false);
    const [holdSeconds, setHoldSeconds] = useState(15 * 60);

    const [isAlreadyPaid, setIsAlreadyPaid] = useState<boolean>(false);
    const [processingState, setProcessingState] = useState<'IDLE' | 'WAITING_REDIRECT'>('IDLE');

    const processTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        return () => {
            if (processTimerRef.current) clearTimeout(processTimerRef.current);
        };
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setHoldSeconds(s => (s > 0 ? s - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetch('https://api.vietqr.io/v2/banks')
            .then(res => res.json())
            .then(data => {
                if (data.code === '00' && Array.isArray(data.data) && data.data.length > 0) {
                    setBanksList(data.data);
                }
            })
            .catch(() => {});
    }, []);

    const [property, setProperty] = useState<Property>(() => store.getProperty(propertyId) || store.getProperty(1)!);
    const [room, setRoom] = useState<Room>(() => store.getAllRooms().find(r => r.id === roomId) || store.getAllRooms()[0]);
    const [notFoundError, setNotFoundError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setNotFoundError(null);
        Promise.all([stayApi.getProperty(propertyId), stayApi.getRooms(propertyId)]).then(([propRes, roomsRes]) => {
            if (!active) return;
            if (!propRes.success || !propRes.data) {
                setNotFoundError(propRes.message || `Không tìm thấy cơ sở lưu trú có ID: ${propertyId}`);
                return;
            }
            setProperty(propRes.data);
            if (!roomsRes.success || !Array.isArray(roomsRes.data) || roomsRes.data.length === 0) {
                setNotFoundError('Cơ sở lưu trú này hiện chưa có phòng cho thuê.');
                return;
            }
            const requestedRoomId = searchParams.get('roomId');
            const matched = roomsRes.data.find((r: Room) => r.id === roomId);
            if (requestedRoomId && !matched) {
                setNotFoundError(`Không tìm thấy phòng có ID ${roomId} thuộc cơ sở lưu trú này.`);
                return;
            }
            setRoom(matched || roomsRes.data[0]);
        });
        return () => {
            active = false;
        };
    }, [propertyId, roomId, searchParams]);

    const quote = store.calculateQuote(room.id, checkIn, checkOut, guests, room);
    const nights = quote.nights || Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) || 1);
    const subtotal = quote.subtotal ?? (room.price * nights);
    const discountAmount = appliedPromo ? Math.min(appliedPromo.discountAmount, subtotal) : 0;
    const totalAmount = Math.max(0, subtotal - discountAmount);
    const depositAmount = Math.round(totalAmount * 0.3);
    const activePaymentAmount = paymentMethod === 'cod' ? depositAmount : totalAmount;
    const remainingAtHotel = paymentMethod === 'cod' ? (totalAmount - depositAmount) : 0;

    // Xóa mã giảm giá đã áp dụng nếu giá gốc thay đổi sau khi sửa ngày
    useEffect(() => {
        setAppliedPromo(null);
    }, [checkIn, checkOut, room.id]);

    const selectedBankObj = banksList.find(b => b.code === selectedBankCode);
    const holdMin = String(Math.floor(holdSeconds / 60)).padStart(2, '0');
    const holdSec = String(holdSeconds % 60).padStart(2, '0');

    const handleApplyPromo = async () => {
        const code = promoInput.trim().toUpperCase();
        if (!code) {
            addToast('Vui lòng nhập mã giảm giá.', 'warn');
            return;
        }
        setPromoLoading(true);
        const res = await stayApi.applyPromotion(code, subtotal);
        setPromoLoading(false);
        if (res.success && res.data) {
            setAppliedPromo({ code: res.data.code, discountAmount: res.data.discountAmount });
            addToast(`Đã áp dụng mã ${res.data.code} (-${formatVND(res.data.discountAmount)})`, 'success');
        } else {
            addToast(res.message || 'Mã giảm giá không hợp lệ hoặc chưa đủ điều kiện.', 'error');
        }
    };

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!currentUser) {
            addToast('Vui lòng đăng nhập hoặc đăng ký tài khoản để tiếp tục đặt phòng.', 'warn');
            navigate('/login', { state: { from: location } });
            return;
        }

        if (isAlreadyPaid) {
            addToast('Đơn đặt phòng này đã được ghi nhận thanh toán.', 'error');
            return;
        }

        if (!quote.success) {
            addToast(quote.message || 'Thông tin đặt phòng chưa hợp lệ.', 'error');
            return;
        }

        setProcessingState('WAITING_REDIRECT');

        const dbMethod = paymentMethod === 'cod' ? 'CASH' : 'BANK_TRANSFER';
        const subChannelLabel =
            paymentMethod === 'cod'
                ? 'Đặt cọc 30% - Trả 70% khi nhận phòng'
                : `Chuyển khoản ngân hàng (${selectedBankObj?.shortName || selectedBankCode})`;
        const txnCode = 'TXN-' + Math.floor(100000 + Math.random() * 900000);

        processTimerRef.current = setTimeout(async () => {
            try {
                const bookingPayload: Partial<Booking> & { promoCode?: string } = {
                    roomId: room.id,
                    propertyId: property.id,
                    propertyName: property.name,
                    roomName: room.name,
                    checkIn,
                    checkOut,
                    nights,
                    guests: Number(guests) || 1,
                    guestUsername: currentUser.username,
                    guestName,
                    guestPhone,
                    guestEmail,
                    pricePerNight: subtotal / nights,
                    subtotal,
                    serviceFee: 0,
                    total: totalAmount,
                    paymentMethod: dbMethod,
                    payment_method: dbMethod,
                    promoCode: appliedPromo?.code,
                };

                const apiRes = await stayApi.createBooking(bookingPayload);

                if (!apiRes.success || !apiRes.data) {
                    addToast(apiRes.message || 'Lỗi đặt phòng từ máy chủ', 'error');
                    setProcessingState('IDLE');
                    return;
                }

                const realBooking = apiRes.data;
                store.syncBookingFromApi(realBooking);
                setIsAlreadyPaid(true);
                addToast(
                    paymentMethod === 'cod'
                        ? 'Đã gửi yêu cầu giữ chỗ (cọc 30%), chờ chủ nhà xác nhận!'
                        : 'Đã gửi yêu cầu đặt phòng và thanh toán, chờ chủ nhà xác nhận!',
                    'success'
                );

                const params = new URLSearchParams({
                    code: realBooking.code,
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
        }, 1200);
    };

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

    if (!inParam || !outParam) {
        return <LoadingSpinner minHeight="50vh" message="Đang chuyển hướng về trang chỗ nghỉ để chọn ngày nhận và trả phòng..." />;
    }

    if (notFoundError) {
        return (
            <div style={{ maxWidth: 760, margin: '3rem auto', padding: '0 1.5rem' }}>
                <Alert type="error" title="Không thể đặt phòng">
                    <p style={{ margin: '0.4rem 0 1rem' }}>{notFoundError}</p>
                    <Button type="button" variant="primary" size="sm" onClick={() => navigate('/search')}>
                        Tìm chỗ ở khác
                    </Button>
                </Alert>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1760, margin: '1.5rem auto 4rem', padding: '0 2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="outline" size="sm" icon={<ChevronLeft />} onClick={() => navigate(-1)} />
                    <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
                        Yêu cầu đặt phòng / chỗ ở
                    </h1>
                </div>
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '0.45rem 0.9rem',
                        borderRadius: 999,
                        background: holdSeconds > 0 ? 'var(--color-warning-bg)' : 'var(--color-danger-bg)',
                        color: holdSeconds > 0 ? 'var(--color-warning)' : 'var(--color-danger)',
                        border: '1px solid var(--color-warning-border)',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                    }}
                >
                    <ClockHistory />
                    <span>
                        {holdSeconds > 0
                            ? `Thời gian giữ phòng: ${holdMin}:${holdSec}`
                            : 'Hết phiên giữ chỗ, vui lòng kiểm tra lại phòng trống'}
                    </span>
                </div>
            </div>

            {!quote.success && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <Alert type="error" title="Không thể tiếp tục với lựa chọn hiện tại">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.35rem' }}>
                            <span>{quote.message}</span>
                            <Button type="button" variant="outline" size="sm" onClick={() => setEditingStay(true)}>
                                Sửa ngày / số khách ngay
                            </Button>
                        </div>
                    </Alert>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="quote-layout">
                    {/* 1. THÔNG TIN NGƯỜI ĐẠI DIỆN ĐẶT PHÒNG */}
                    <div className="quote-guest-section">
                        <Card
                            title={
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                                            <PersonBadge style={{ fontSize: '1.25rem' }} />
                                        </div>
                                        <strong style={{ fontSize: '1.08rem', color: 'var(--color-text-primary)' }}>Thông tin người đại diện đặt phòng</strong>
                                    </div>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 700 }}>
                                        <LockFill style={{ fontSize: '0.8rem' }} /> Bảo mật thông tin
                                    </div>
                                </div>
                            }
                        >
                            <label
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: '1rem',
                                    fontSize: '0.88rem',
                                    fontWeight: 600,
                                    color: 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={bookingForOther}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setBookingForOther(checked);
                                        if (checked) {
                                            setGuestName('');
                                            setGuestPhone('');
                                            setGuestEmail('');
                                        } else if (currentUser) {
                                            setGuestName(currentUser.fullName || '');
                                            setGuestPhone(currentUser.phone || '');
                                            setGuestEmail(currentUser.email || '');
                                        }
                                    }}
                                />
                                <span>Tôi đặt phòng cho người khác nhận phòng</span>
                            </label>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.15rem', marginBottom: '1.15rem' }}>
                                <InputField
                                    id="name"
                                    label="Họ và tên khách nhận phòng"
                                    placeholder="Ví dụ: Nguyễn Văn An"
                                    required
                                    value={guestName}
                                    onChange={e => setGuestName(e.target.value)}
                                    helperText="Tên trên CCCD hoặc hộ chiếu khi nhận phòng"
                                />
                                <InputField
                                    id="phone"
                                    label="Số điện thoại di động"
                                    placeholder="Ví dụ: 0912345678"
                                    required
                                    value={guestPhone}
                                    onChange={e => setGuestPhone(e.target.value)}
                                    helperText="Chủ nhà liên hệ khi cần hỗ trợ nhận phòng"
                                />
                            </div>
                            <InputField
                                id="email"
                                type="email"
                                label="Email nhận phiếu xác nhận"
                                placeholder="Ví dụ: an.nguyen@gmail.com"
                                required
                                value={guestEmail}
                                onChange={e => setGuestEmail(e.target.value)}
                                helperText="Mã đặt phòng và hướng dẫn tự nhận phòng sẽ được gửi về email này"
                            />
                        </Card>
                    </div>

                    {/* 2. PHƯƠNG THỨC THANH TOÁN */}
                    <div className="quote-payment-section">
                        <Card title="Phương thức thanh toán">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
                                <div
                                    onClick={() => setPaymentMethod('cod')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.9rem 1.1rem',
                                        borderRadius: 12,
                                        border: paymentMethod === 'cod' ? '2px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
                                        background: paymentMethod === 'cod' ? 'var(--color-primary-soft)' : 'var(--color-bg-surface)',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <CashCoin style={{ fontSize: '1.4rem', color: paymentMethod === 'cod' ? 'var(--color-primary)' : 'var(--color-success)', flexShrink: 0 }} />
                                        <div>
                                            <strong style={{ display: 'block', fontSize: '0.95rem', color: paymentMethod === 'cod' ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>
                                                Đặt cọc 30% trước
                                            </strong>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Trả 70% còn lại khi nhận phòng</span>
                                        </div>
                                    </div>
                                    {paymentMethod === 'cod' ? (
                                        <CheckCircleFill style={{ color: 'var(--color-primary)', fontSize: '1.2rem', flexShrink: 0 }} />
                                    ) : (
                                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--color-border-subtle)', flexShrink: 0 }} />
                                    )}
                                </div>

                                <div
                                    onClick={() => setPaymentMethod('bank')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.9rem 1.1rem',
                                        borderRadius: 12,
                                        border: paymentMethod === 'bank' ? '2px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
                                        background: paymentMethod === 'bank' ? 'var(--color-primary-soft)' : 'var(--color-bg-surface)',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <CreditCard style={{ fontSize: '1.4rem', color: paymentMethod === 'bank' ? 'var(--color-primary)' : 'var(--color-text-primary)', flexShrink: 0 }} />
                                        <div>
                                            <strong style={{ display: 'block', fontSize: '0.95rem', color: paymentMethod === 'bank' ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>
                                                Thanh toán toàn bộ 100%
                                            </strong>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Chuyển khoản qua ngân hàng nội địa</span>
                                        </div>
                                    </div>
                                    {paymentMethod === 'bank' ? (
                                        <CheckCircleFill style={{ color: 'var(--color-primary)', fontSize: '1.2rem', flexShrink: 0 }} />
                                    ) : (
                                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--color-border-subtle)', flexShrink: 0 }} />
                                    )}
                                </div>
                            </div>

                            {paymentMethod === 'bank' && (
                                <div style={{ paddingTop: '0.5rem' }}>
                                    <label
                                        htmlFor="bank-select"
                                        style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.45rem' }}
                                    >
                                        Ngân hàng thanh toán
                                    </label>
                                    <select
                                        id="bank-select"
                                        value={selectedBankCode}
                                        onChange={e => setSelectedBankCode(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.7rem 0.9rem',
                                            borderRadius: 10,
                                            border: '1px solid var(--color-border-strong)',
                                            background: 'var(--color-bg-surface)',
                                            color: 'var(--color-text-primary)',
                                            fontSize: '0.92rem',
                                        }}
                                    >
                                        {banksList.map(bank => (
                                            <option key={bank.code} value={bank.code}>
                                                {bank.shortName} ({bank.code}) - {bank.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* 3. THẺ TÓM TẮT ĐƠN */}
                    <aside className="quote-sidebar">
                        <div className="unified-sidebar-sticky">
                            <div className="unified-sidebar-card">
                                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '1.25rem', marginBottom: '1rem' }}>
                                    <img
                                        src={property.image}
                                        alt={property.name}
                                        style={{
                                            width: 104,
                                            height: 104,
                                            borderRadius: 14,
                                            objectFit: 'cover',
                                            flexShrink: 0,
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                        }}
                                    />
                                    <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <div>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.15rem' }}>
                                                {property.type} · {property.city}
                                            </span>
                                            <strong style={{ fontSize: '1.02rem', display: 'block', margin: '0.1rem 0 0.25rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {property.name}
                                            </strong>
                                            <span style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', display: 'block' }}>
                                                Hạng phòng: {room.name}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', marginTop: 4 }}>
                                            {property.rating && property.rating > 0 && ((property.reviewsCount ?? property.reviewCount ?? 0) > 0) ? (
                                                <>
                                                    <StarFill style={{ fontSize: '0.8rem', color: '#FFD700' }} />
                                                    <strong style={{ color: 'var(--color-text-primary)' }}>{property.rating.toFixed(1)}</strong>
                                                    <span style={{ color: 'var(--color-text-muted)' }}>({property.reviewsCount ?? property.reviewCount} đánh giá)</span>
                                                </>
                                            ) : (
                                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>Chưa có đánh giá</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <div
                                        title="ODauDay bảo vệ quyền lợi khách hàng và hoàn tiền theo chính sách hủy phòng."
                                        role="note"
                                        aria-label="Bảo vệ quyền lợi khách hàng"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '6px 12px',
                                            borderRadius: 999,
                                            background: 'linear-gradient(135deg, var(--color-success-bg), var(--color-success-border))',
                                            border: '1px solid var(--color-success-border)',
                                            color: 'var(--color-success)',
                                            fontSize: '0.78rem',
                                            fontWeight: 700,
                                            cursor: 'help',
                                        }}
                                    >
                                        <ShieldCheck style={{ fontSize: '1rem', color: 'var(--color-success)', flexShrink: 0 }} />
                                        <span>Bảo vệ quyền lợi khách hàng</span>
                                    </div>
                                </div>

                                <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, var(--color-bg-app) 0%, var(--color-bg-muted) 55%, var(--color-primary-soft) 100%)', borderRadius: 16, padding: '1rem', border: '1px solid var(--color-border-subtle)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: '0.9rem' }}>
                                        <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>Thông tin kỳ nghỉ</strong>
                                        <button
                                            type="button"
                                            onClick={() => setEditingStay(v => !v)}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                background: 'rgba(255,255,255,0.85)',
                                                border: '1px solid var(--color-border-subtle)',
                                                borderRadius: 999,
                                                padding: '3px 10px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                color: 'var(--color-primary)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <PencilSquare /> {editingStay ? 'Xong' : 'Chỉnh sửa'}
                                        </button>
                                    </div>

                                    {editingStay ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: '0.75rem' }}>
                                            <DateRangePicker
                                                label="Ngày nhận và trả phòng"
                                                value={{ start: checkIn, end: checkOut }}
                                                onChange={range => {
                                                    setCheckIn(range.start);
                                                    setCheckOut(range.end);
                                                }}
                                            />
                                            <div>
                                                <label htmlFor="quote-guests" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                                                    Số lượng khách (tối đa {room.capacity})
                                                </label>
                                                <select
                                                    id="quote-guests"
                                                    value={guests}
                                                    onChange={e => setGuests(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.5rem 0.65rem',
                                                        borderRadius: 8,
                                                        border: '1px solid var(--color-border-strong)',
                                                        background: 'var(--color-bg-surface)',
                                                    }}
                                                >
                                                    {Array.from({ length: Math.max(1, room.capacity) }, (_, idx) => idx + 1).map(n => (
                                                        <option key={n} value={String(n)}>
                                                            {n} khách
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
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
                                                <strong style={{ color: Number(guests) > room.capacity ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>
                                                    {guests} khách <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>/ tối đa {room.capacity}</span>
                                                </strong>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Mã giảm giá (Voucher) */}
                                <div style={{ marginBottom: '1.15rem' }}>
                                    <label htmlFor="promo-code-input" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--color-text-primary)' }}>
                                        <Tag /> Mã giảm giá / Voucher
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            id="promo-code-input"
                                            type="text"
                                            placeholder="Ví dụ: ODAUDAY10"
                                            value={promoInput}
                                            disabled={Boolean(appliedPromo) || promoLoading}
                                            onChange={e => setPromoInput(e.target.value.toUpperCase())}
                                            style={{
                                                flex: 1,
                                                minWidth: 0,
                                                padding: '0.55rem 0.75rem',
                                                borderRadius: 10,
                                                border: '1px solid var(--color-border-strong)',
                                                fontSize: '0.88rem',
                                            }}
                                        />
                                        {appliedPromo ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setAppliedPromo(null);
                                                    setPromoInput('');
                                                }}
                                            >
                                                Hủy mã
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={promoLoading}
                                                onClick={handleApplyPromo}
                                            >
                                                {promoLoading ? 'Kiểm tra...' : 'Áp dụng'}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <h3 style={{ fontSize: '1.02rem', fontWeight: 750, margin: '0 0 0.8rem', color: 'var(--color-text-primary)' }}>Chi tiết thanh toán</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}>
                                        <span>Giá phòng · {nights} đêm</span>
                                        <strong style={{ color: 'var(--color-text-secondary)' }}>{formatVND(subtotal)}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}>
                                        <span>Phí dịch vụ &amp; thuế</span>
                                        <strong style={{ color: 'var(--color-success)' }}>Đã bao gồm</strong>
                                    </div>
                                    {appliedPromo && discountAmount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
                                            <span>Giảm giá ({appliedPromo.code})</span>
                                            <strong>-{formatVND(discountAmount)}</strong>
                                        </div>
                                    )}
                                    {paymentMethod === 'cod' ? (
                                        <div style={{ marginTop: 4, padding: '0.85rem 1rem', borderRadius: 12, background: 'linear-gradient(120deg, var(--color-warning-bg), var(--color-primary-soft))', border: '1px solid var(--color-warning)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-warning)' }}>Cần đặt cọc ngay (30%)</span>
                                                <strong style={{ fontSize: '1.18rem', color: 'var(--color-primary)', fontWeight: 800, whiteSpace: 'nowrap' }}>{formatVND(depositAmount)}</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.78rem', color: 'var(--color-warning)', marginTop: 7 }}>
                                                <span>Còn lại khi nhận phòng (70%)</span><strong>{formatVND(remainingAtHotel)}</strong>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ marginTop: 4, padding: '0.85rem 1rem', borderRadius: 12, background: 'linear-gradient(120deg, var(--color-primary-soft), var(--color-primary-soft))', border: '1px solid var(--color-primary-border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-danger)' }}>Tổng thanh toán</span>
                                                <strong style={{ fontSize: '1.18rem', color: 'var(--color-primary)', fontWeight: 800, whiteSpace: 'nowrap' }}>{formatVND(totalAmount)}</strong>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginTop: '1.25rem' }}>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        icon={<CalendarCheck />}
                                        disabled={!quote.success || isAlreadyPaid}
                                        style={{ width: '100%', height: 48, borderRadius: 14, fontSize: '1rem', fontWeight: 700, justifyContent: 'center' }}
                                    >
                                        {paymentMethod === 'cod' ? 'Xác nhận đặt cọc 30%' : 'Xác nhận thanh toán'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* 4. CHÍNH SÁCH HỦY PHÒNG & ĐIỀU KHOẢN */}
                    <div className="quote-policy-section">
                        <Card title="Chính sách hủy phòng">
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                                Hủy miễn phí và hoàn lại 100% tiền cọc nếu thực hiện {formatFreeCancelDeadline(checkIn)}. Sau thời hạn này, khoản đặt cọc 30% không được hoàn lại trừ trường hợp bất khả kháng được chủ nhà xác nhận. Yêu cầu đặt phòng sẽ chuyển đến chủ nhà xác nhận (trạng thái chờ duyệt).
                            </p>
                        </Card>
                        <div style={{ marginTop: '1.25rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
                                Bằng cách nhấn nút xác nhận thanh toán, bạn đồng ý với Nội quy nhà của Chủ nhà, Các quy tắc nền tảng của ODauDay Stay và Điều khoản dịch vụ.
                            </p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
