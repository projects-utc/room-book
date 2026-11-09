// Airbnb-Inspired Booking Checkout Page (Standardized Components)
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { InputField, Button, Card, Badge, Breadcrumb } from '../../components';
import { formatVND } from '../../constants';
import { ChevronLeft, StarFill, CreditCard, CashCoin, ShieldCheck, CalendarCheck, CheckCircleFill } from 'react-bootstrap-icons';
import { stayApi } from '../../api/stayApi';

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

  const nights = quote.nights || 2;
  const subtotal = quote.subtotal || (room.price * nights);
  const totalAmount = quote.total || (room.price * nights);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAlreadyPaid) {
      addToast('Đơn đặt phòng này đã được ghi nhận thanh toán.', 'error');
      return;
    }

    if (!quote.success) {
      addToast(quote.message || 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm!', 'error');
      return;
    }

    const dbMethod = paymentMethod === 'cod' ? 'CASH' : 'BANK_TRANSFER';
    const subChannelLabel = bankSubMode === 'QR_CODE' ? 'Quét mã VietQR' : `Chuyển hướng (${selectedBankObj?.shortName || selectedBankCode})`;
    const txnCode = 'TXN-' + Math.floor(100000 + Math.random() * 900000);

    // Prepare booking payload for Oracle backend API
    const bookingPayload = {
      propertyId: property.id,
      propertyName: property.name,
      roomId: room.id,
      roomName: room.name,
      checkIn,
      checkOut,
      nights,
      guests: Number(guests) || 1,
      pricePerNight: room.price,
      subtotal,
      serviceFee: 0,
      total: totalAmount,
      guestUsername: currentUser?.username || 'guest.demo',
      guestName,
      guestPhone,
      guestEmail,
      status: 'PENDING' as const,
    };

    // ── Mô phỏng kết quả thanh toán theo lựa chọn test ──────────────────────
    if (simulateOutcome === 'FAILED') {
      // Hiện màn hình thất bại — KHÔNG tạo booking, KHÔNG lưu dữ liệu
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
      return;
    }

    try {
      // Call backend API immediately to persist booking in Oracle DB
      const apiRes = await stayApi.createBooking(bookingPayload);
      const createdCode = apiRes.success && apiRes.data?.code ? apiRes.data.code : 'ODD-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

      // Sync to local store
      store.createBooking({ roomId: room.id, checkIn, checkOut, guests, guestName, guestPhone, guestEmail });

      setIsAlreadyPaid(true);
      addToast(paymentMethod === 'cod' ? 'Xác nhận đặt cọc 30% thành công!' : 'Đặt phòng thành công!', 'success');

      // Navigate to booking-success
      const params = new URLSearchParams({
        code: createdCode,
        txn: txnCode,
        method: dbMethod,
        channel: subChannelLabel,
        amount: String(activePaymentAmount),
      });
      navigate(`/booking-success?${params.toString()}`);
    } catch (err) {
      console.error('Error creating booking via API:', err);
      addToast('Không thể kết nối đến máy chủ đặt phòng', 'error');
    }
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
        {/* Header */}
        <div className="page-top-nav">
          <Button variant="outline" size="sm" icon={<ChevronLeft />} onClick={() => navigate(-1)} />
          <h1>Xác nhận và đặt phòng</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="checkout-grid">
            {/* CỘT TRÁI */}
            <div>
              {/* Thông tin đại diện */}
              <Card title="Thông tin người đặt phòng" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <InputField id="name" label="Họ và tên" required value={guestName} onChange={e => setGuestName(e.target.value)} />
                  <InputField id="phone" label="Số điện thoại" required value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
                </div>
                <InputField id="email" type="email" label="Email nhận xác nhận" required value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
              </Card>

              {/* Phương thức thanh toán */}
              <Card title="Phương thức thanh toán" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

                  {/* COD */}
                  <label className={`payment-method-card${paymentMethod === 'cod' ? ' selected' : ''}`} onClick={() => setPaymentMethod('cod')}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                      <input type="radio" name="payMethod" checked={paymentMethod === 'cod'} onChange={() => {}} style={{ display: 'none' }} />
                      <CashCoin style={{ fontSize: '1.5rem', color: paymentMethod === 'cod' ? '#E11D48' : '#059669', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.95rem', color: paymentMethod === 'cod' ? '#BE123C' : '#1E293B', marginBottom: 3 }}>Đặt cọc 30% giữ phòng (70% thanh toán khi nhận phòng)</strong>
                        <span style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.4, display: 'block' }}>Đặt cọc trước để giữ chỗ, thanh toán phần còn lại khi nhận phòng.</span>
                      </div>
                    </div>
                    {paymentMethod === 'cod' && <CheckCircleFill style={{ color: '#E11D48', fontSize: '1.1rem', flexShrink: 0 }} />}
                  </label>

                  {/* Bank */}
                  <label className={`payment-method-card${paymentMethod === 'bank' ? ' selected' : ''}`} onClick={() => setPaymentMethod('bank')}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                      <input type="radio" name="payMethod" checked={paymentMethod === 'bank'} onChange={() => {}} style={{ display: 'none' }} />
                      <CreditCard style={{ fontSize: '1.5rem', color: paymentMethod === 'bank' ? '#E11D48' : '#1E293B', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.95rem', color: paymentMethod === 'bank' ? '#BE123C' : '#1E293B', marginBottom: 3 }}>Chuyển khoản / Quét mã QR (Thanh toán 100%)</strong>
                        <span style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.4, display: 'block' }}>Hoàn tất thanh toán trực tuyến an toàn, nhận phòng ngay.</span>
                      </div>
                    </div>
                    {paymentMethod === 'bank' && <CheckCircleFill style={{ color: '#E11D48', fontSize: '1.1rem', flexShrink: 0 }} />}
                  </label>
                </div>

                {/* QR / Ngân hàng Box */}
                <div style={{ marginTop: '1.25rem', padding: '1.15rem', borderRadius: 14, border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                  <div style={{ display: 'flex', background: '#E2E8F0', padding: 4, borderRadius: 10, marginBottom: '1rem' }}>
                    <button type="button" onClick={() => setBankSubMode('QR_CODE')} style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 8, border: 'none', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', backgroundColor: bankSubMode === 'QR_CODE' ? '#ffffff' : 'transparent', color: '#1E293B', boxShadow: bankSubMode === 'QR_CODE' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>
                      Quét mã VietQR
                    </button>
                    <button type="button" onClick={() => setBankSubMode('BANK_REDIRECT')} style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 8, border: 'none', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', backgroundColor: bankSubMode === 'BANK_REDIRECT' ? '#ffffff' : 'transparent', color: '#1E293B', boxShadow: bankSubMode === 'BANK_REDIRECT' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>
                      Thanh toán qua ứng dụng Ngân hàng
                    </button>
                  </div>

                  {bankSubMode === 'QR_CODE' ? (
                      <div>
                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                          <div style={{ display: 'inline-block', background: '#ffffff', padding: '0.75rem', borderRadius: 12, border: '1px solid #F1F5F9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <img src={vietQrUrl} alt="VietQR" style={{ width: 180, height: 'auto', display: 'block', margin: '0 auto 0.5rem' }} />
                            <button type="button" onClick={handleDownloadQr} disabled={isDownloadingQr} style={{ width: '100%', padding: '0.4rem 0.85rem', borderRadius: 6, backgroundColor: '#FFF1F2', color: '#E11D48', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #FECDD3', cursor: 'pointer' }}>
                              {isDownloadingQr ? 'Đang tải...' : '⬇ Tải ảnh mã QR'}
                            </button>
                          </div>
                        </div>
                        <div style={{ background: '#ffffff', borderRadius: 10, padding: '0.85rem 1rem', border: '1px solid #E2E8F0', fontSize: '0.84rem' }}>
                          <div className="info-row"><span>Chủ TK:</span><strong>{receiverAccount.accountName}</strong></div>
                          <div className="info-row"><span>Ngân hàng:</span><strong>{receiverAccount.bankName}</strong></div>
                          <div className="info-row">
                            <span>Số TK:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong>{receiverAccount.accountNo}</strong>
                              <button type="button" onClick={() => handleCopy(receiverAccount.accountNo, 'STK')} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer' }}>{copiedField === 'STK' ? 'Đã sao chép' : 'Sao chép'}</button>
                            </div>
                          </div>
                          <div className="info-row">
                            <span>Nội dung:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong style={{ color: '#E11D48' }}>{receiverAccount.content}</strong>
                              <button type="button" onClick={() => handleCopy(receiverAccount.content, 'CONTENT')} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer' }}>{copiedField === 'CONTENT' ? 'Đã sao chép' : 'Sao chép'}</button>
                            </div>
                          </div>
                        </div>
                      </div>
                  ) : (
                      <div>
                        <div style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: '0.75rem' }}>Chọn ngân hàng để tiếp tục thanh toán.</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.65rem', maxHeight: '260px', overflowY: 'auto', overflowX: 'hidden', padding: '2px 6px 2px 2px' }}>
                          {banksList.map(bank => {
                            const isSelected = selectedBankCode === bank.code;
                            return (
                                <button key={bank.id} type="button" onClick={() => setSelectedBankCode(bank.code)} style={{ padding: '0.65rem 0.7rem', minWidth: 0, minHeight: 54, borderRadius: 12, border: isSelected ? '2px solid #E11D48' : '1px solid #E2E8F0', backgroundColor: isSelected ? '#FFF1F2' : '#ffffff', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                  {bank.logo ? (
                                      <>
                                        <img src={bank.logo} alt={bank.shortName} style={{ width: 40, height: 28, objectFit: 'contain', flex: '0 0 40px', background: '#fff', borderRadius: 6, padding: 3, border: '1px solid #e2e8f0' }}
                                             onError={(e) => { const img = e.currentTarget; img.style.display = 'none'; const fb = img.nextElementSibling as HTMLElement | null; if (fb) fb.style.display = 'flex'; }} />
                                        <div style={{ display: 'none', width: 40, height: 28, flex: '0 0 40px', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: '#F1F5F9', color: '#475569', fontSize: '0.65rem', fontWeight: 800, border: '1px solid #E2E8F0' }}>{bank.code}</div>
                                      </>
                                  ) : (
                                      <div style={{ width: 40, height: 28, flex: '0 0 40px', background: '#E2E8F0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700 }}>{bank.code}</div>
                                  )}
                                  <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bank.shortName}</div>
                                    <div style={{ fontSize: '0.68rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bank.name}</div>
                                  </div>
                                </button>
                            );
                          })}
                        </div>
                      </div>
                  )}
                </div>

                {/* Sim Test Box */}
                <div className="sim-box">
                  <label>Chế độ kiểm thử giao dịch (Demo):</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className={`sim-btn sim-btn-success${simulateOutcome === 'SUCCESS' ? ' active' : ''}`} onClick={() => setSimulateOutcome('SUCCESS')}>✓ PAID</button>
                    <button type="button" className={`sim-btn sim-btn-fail${simulateOutcome === 'FAILED' ? ' active' : ''}`} onClick={() => setSimulateOutcome('FAILED')}>✕ FAILED</button>
                  </div>
                </div>
              </Card>

              {/* Chính sách */}
              <Card title="Chính sách hủy phòng">
                <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>Hủy miễn phí trước 48 giờ so với thời điểm nhận phòng. Sau thời gian này, việc hủy sẽ tuân theo thỏa thuận trực tiếp cùng chủ nhà.</p>
              </Card>

              <p style={{ fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.6, marginTop: '1.5rem' }}>
                Bằng cách nhấn xác nhận, bạn đồng ý với Nội quy nhà của Chủ nhà, Các quy tắc nền tảng và Điều khoản dịch vụ của ODauDay Stay.
              </p>
            </div>

            {/* CỘT PHẢI */}
            <aside style={{ position: 'sticky', top: '6rem' }}>
              <div className="booking-summary-card">
                {/* Property thumbnail */}
                <div style={{ display: 'flex', gap: '0.85rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.15rem', marginBottom: '1rem' }}>
                  <img src={property.image} alt={property.name} style={{ width: 86, height: 80, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>{property.type} · {property.city}</span>
                    <strong style={{ fontSize: '0.95rem', display: 'block', margin: '0.15rem 0' }}>{property.name}</strong>
                    <span style={{ fontSize: '0.82rem', color: '#475569', display: 'block' }}>Hạng phòng: {room.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', marginTop: 3 }}>
                      <StarFill style={{ fontSize: '0.72rem', color: '#E11D48' }} />
                      <strong>{property.rating?.toFixed(2) || '4.80'}</strong>
                      <span style={{ color: '#94A3B8' }}>(18 đánh giá)</span>
                    </div>
                  </div>
                </div>

                {/* Bảo vệ quyền lợi */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 999, background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', border: '1px solid #A7F3D0', color: '#047857', fontSize: '0.76rem', fontWeight: 700 }}>
                    <ShieldCheck style={{ fontSize: '0.95rem', color: '#059669' }} />
                    <span>Bảo vệ quyền lợi khách hàng</span>
                  </div>
                </div>

                {/* Chi tiết đặt phòng */}
                <div style={{ background: 'linear-gradient(135deg,#F8FAFC,#FFF1F2)', borderRadius: 14, padding: '0.9rem', border: '1px solid #E2E8F0', marginBottom: '1.1rem' }}>
                  <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0F172A', marginBottom: '0.6rem' }}>Chi tiết đặt phòng</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.8)', borderRadius: 10, padding: '0.65rem 0.75rem', border: '1px solid rgba(226,232,240,0.9)' }}>
                    <div>
                      <span style={{ display: 'block', color: '#64748B', fontSize: '0.68rem', marginBottom: 2 }}>NHẬN PHÒNG</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.88rem' }}>{checkIn}</strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#E11D48', fontSize: '0.65rem', fontWeight: 700 }}>
                      <span style={{ width: 24, height: 1, background: '#FDA4AF', display: 'block' }} />
                      <span style={{ whiteSpace: 'nowrap', margin: '3px 0' }}>{nights} ĐÊM</span>
                      <span style={{ width: 24, height: 1, background: '#FDA4AF', display: 'block' }} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', color: '#64748B', fontSize: '0.68rem', marginBottom: 2 }}>TRẢ PHÒNG</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.88rem' }}>{checkOut}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem', fontSize: '0.82rem' }}>
                    <span style={{ color: '#64748B' }}>Số lượng khách</span>
                    <strong style={{ color: '#1E293B' }}>{guests} khách <span style={{ color: '#94A3B8', fontWeight: 500 }}>/ tối đa {room.capacity}</span></strong>
                  </div>
                </div>

                {/* Chi tiết thanh toán */}
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.75rem', color: '#0F172A' }}>Chi tiết thanh toán</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.86rem' }}>
                  <div className="info-row"><span>Giá phòng · {nights} đêm</span><strong>{formatVND(subtotal)}</strong></div>
                  <div className="info-row"><span>Phí dịch vụ</span><strong style={{ color: '#059669' }}>Miễn phí</strong></div>
                </div>

                {paymentMethod === 'cod' ? (
                    <div style={{ marginTop: '0.75rem', padding: '0.85rem', borderRadius: 12, background: 'linear-gradient(120deg,#FFFBEB,#FFF7ED)', border: '1px solid #FCD34D' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#92400E' }}>Đặt cọc ngay (30%)</span>
                        <strong style={{ fontSize: '1.05rem', color: '#E11D48' }}>{formatVND(depositAmount)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#92400E', marginTop: 6 }}>
                        <span>Còn lại khi nhận phòng (70%)</span><strong>{formatVND(remainingAtHotel)}</strong>
                      </div>
                    </div>
                ) : (
                    <div style={{ marginTop: '0.75rem', padding: '0.85rem', borderRadius: 12, background: 'linear-gradient(120deg,#FFF1F2,#FFF7F8)', border: '1px solid #FECDD3' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#BE123C' }}>Tổng thanh toán</span>
                        <strong style={{ fontSize: '1.05rem', color: '#E11D48' }}>{formatVND(totalAmount)}</strong>
                      </div>
                    </div>
                )}

                <div style={{ marginTop: '1.25rem' }}>
                  <Button type="submit" variant="primary" size="lg" icon={<CalendarCheck />} style={{ width: '100%', justifyContent: 'center' }}>
                    {paymentMethod === 'cod' ? 'Xác nhận đặt cọc 30%' : 'Xác nhận thanh toán'}
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>
  );
}