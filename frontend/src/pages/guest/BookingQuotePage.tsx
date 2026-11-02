import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { Alert, InputField, Button, Card, Badge } from '../../components';
import { formatVND } from '../../constants';
import { ChevronLeft, StarFill, CreditCard, CashCoin, ShieldCheck, CalendarCheck } from 'react-bootstrap-icons';

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
  const checkIn = searchParams.get('in') || '2027-01-10';
  const checkOut = searchParams.get('out') || '2027-01-12';
  const guests = searchParams.get('guests') || '2';

  const [guestName, setGuestName] = useState(currentUser?.fullName || 'Khách thuê');
  const [guestPhone, setGuestPhone] = useState(currentUser?.phone || '0900000003');
  const [guestEmail, setGuestEmail] = useState(currentUser?.email || 'guest@odauday.vn');

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank'>('bank');
  const [bankSubMode, setBankSubMode] = useState<'QR_CODE' | 'BANK_REDIRECT'>('QR_CODE');
  const [banksList, setBanksList] = useState<BankApiItem[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState('MB');
  const [copiedField, setCopiedField] = useState('');
  const [isDownloadingQr, setIsDownloadingQr] = useState(false);

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
  const subtotal = quote.subtotal || room.price * nights;
  const totalAmount = quote.total || room.price * nights;
  const depositAmount = Math.round(totalAmount * 0.3);
  const activePaymentAmount = paymentMethod === 'cod' ? depositAmount : totalAmount;
  const remainingAtHotel = paymentMethod === 'cod' ? totalAmount - depositAmount : 0;

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
      addToast('Không thể tải mã QR. Vui lòng thử mở ảnh QR và lưu thủ công.', 'error');
    } finally {
      setIsDownloadingQr(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote.success) return addToast(quote.message || 'Thông tin không hợp lệ.', 'error');

    setProcessingState(bankSubMode === 'BANK_REDIRECT' ? 'WAITING_REDIRECT' : 'WAITING_CONFIRM');
    const dbMethod = paymentMethod === 'cod' ? 'CASH' : 'BANK_TRANSFER';
    const subChannelLabel = bankSubMode === 'QR_CODE' ? 'Quét mã VietQR' : `Chuyển hướng (${selectedBankObj?.shortName || selectedBankCode})`;

    setTimeout(() => {
      setProcessingState('IDLE');
      const txnCode = 'TXN-' + Math.floor(100000 + Math.random() * 900000);

      if (simulateOutcome === 'FAILED') {
        addToast('Giao dịch thanh toán thất bại!', 'error');
        return setFailedData({
          transactionCode: txnCode, propertyName: property.name, roomName: room.name,
          checkIn, checkOut, nights, guests, guestName, guestPhone,
          dbMethod, subChannel: subChannelLabel, amount: activePaymentAmount,
        });
      }

      const res = store.createBooking({ roomId: room.id, checkIn, checkOut, guests, guestName, guestPhone, guestEmail });
      if (!res.success) return addToast(res.message || 'Lỗi tạo đơn.', 'error');

      addToast('Đặt phòng và thanh toán thành công!', 'success');
      const params = new URLSearchParams({
        code: res.booking?.code || 'ODD-DEMO', txn: txnCode,
        method: dbMethod, channel: subChannelLabel, amount: String(activePaymentAmount),
      });
      navigate(`/booking-success?${params.toString()}`);
    }, 1800);
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

  if (failedData) {
    return <BookingFailedPage data={failedData} onRetry={() => setFailedData(null)} />;
  }

  return (
      <div style={{ maxWidth: 1080, margin: '2rem auto 4rem', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Button variant="outline" size="sm" icon={<ChevronLeft />} onClick={() => navigate(-1)} />
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#1E293B' }}>Yêu cầu đặt phòng / chỗ ở</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(340px, 400px)', gap: '2.5rem', alignItems: 'start' }}>
            {/* CỘT TRÁI */}
            <div>
              {!quote.success && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <Alert type="error" title="Không thể đặt phòng"><p style={{ margin: 0 }}>{quote.message}</p></Alert>
                  </div>
              )}

              <Card title="Thông tin người đại diện đặt phòng" style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <InputField id="name" label="Họ và tên" required value={guestName} onChange={e => setGuestName(e.target.value)} />
                  <InputField id="phone" label="Số điện thoại di động" required value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
                </div>
                <InputField id="email" type="email" label="Email nhận phiếu xác nhận" required value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
              </Card>

              <Card title="Phương thức thanh toán" style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <label onClick={() => setPaymentMethod('cod')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.25rem', border: paymentMethod === 'cod' ? '1.5px solid #E11D48' : '1px solid #E2E8F0', borderRadius: 14, cursor: 'pointer', background: paymentMethod === 'cod' ? '#FFFBFB' : '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                      <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} style={{ width: 18, height: 18, marginTop: 3, accentColor: '#E11D48' }} />
                      <CashCoin style={{ fontSize: '1.35rem', color: '#059669', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.95rem', color: '#1E293B' }}>Thanh toán tiền mặt khi nhận phòng (COD / Cọc 30%)</strong>
                        <span style={{ fontSize: '0.82rem', color: '#64748B' }}>Đặt cọc trước để giữ chỗ, thanh toán phần còn lại khi nhận phòng.</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: '#F1F5F9', color: '#475569', whiteSpace: 'nowrap' }}>Linh hoạt</span>
                  </label>

                  <label onClick={() => setPaymentMethod('bank')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.25rem', border: paymentMethod === 'bank' ? '1.5px solid #E11D48' : '1px solid #E2E8F0', borderRadius: 14, cursor: 'pointer', background: paymentMethod === 'bank' ? '#FFFBFB' : '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                      <input type="radio" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} style={{ width: 18, height: 18, marginTop: 3, accentColor: '#E11D48' }} />
                      <CreditCard style={{ fontSize: '1.35rem', color: '#E11D48', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.95rem', color: '#1E293B' }}>Chuyển khoản qua mã QR hoặc Ngân hàng (Thanh toán Full)</strong>
                        <span style={{ fontSize: '0.82rem', color: '#64748B' }}>Hoàn tất thanh toán trực tuyến an toàn.</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: '#DCFCE7', color: '#15803D', whiteSpace: 'nowrap' }}>Khuyên dùng</span>
                  </label>
                </div>

                {/* Hộp QR & Ngân hàng */}
                <div style={{ marginTop: '1.25rem', padding: '1.25rem', borderRadius: 14, border: '1px solid #FECDD3', background: '#FFFBFB' }}>
                  <div style={{ display: 'flex', background: '#E2E8F0', padding: 4, borderRadius: 10, marginBottom: '1.15rem' }}>
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
                          backgroundColor: bankSubMode === 'QR_CODE' ? '#ffffff' : 'transparent',
                          color: '#1E293B',
                          boxShadow: bankSubMode === 'QR_CODE' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
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
                          backgroundColor: bankSubMode === 'BANK_REDIRECT' ? '#ffffff' : 'transparent',
                          color: '#1E293B',
                          boxShadow: bankSubMode === 'BANK_REDIRECT' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
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
                                background: '#ffffff',
                                padding: '0.85rem',
                                borderRadius: 12,
                                border: '1px solid #F1F5F9',
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
                                  backgroundColor: '#FFF1F2',
                                  color: '#E11D48',
                                  fontSize: '0.76rem',
                                  fontWeight: 600,
                                  border: '1px solid #FECDD3',
                                  cursor: 'pointer',
                                }}
                            >
                              {isDownloadingQr ? 'Đang tải...' : '⬇ Tải ảnh mã QR thanh toán'}
                            </button>
                          </div>
                        </div>

                        <div
                            style={{
                              background: '#ffffff',
                              borderRadius: 10,
                              padding: '0.85rem 1rem',
                              border: '1px solid #F1F5F9',
                              fontSize: '0.84rem',
                            }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ color: '#64748B' }}>Chủ TK:</span>
                            <strong style={{ color: '#1E293B' }}>{receiverAccount.accountName}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ color: '#64748B' }}>Ngân hàng:</span>
                            <strong style={{ color: '#1E293B' }}>{receiverAccount.bankName}</strong>
                          </div>
                          <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 6,
                              }}
                          >
                            <span style={{ color: '#64748B' }}>STK:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong style={{ color: '#1E293B' }}>{receiverAccount.accountNo}</strong>
                              <button
                                  type="button"
                                  onClick={() => handleCopy(receiverAccount.accountNo, 'STK')}
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    border: '1px solid #CBD5E1',
                                    background: '#F8FAFC',
                                    cursor: 'pointer',
                                  }}
                              >
                                {copiedField === 'STK' ? 'Đã chép' : 'Sao chép'}
                              </button>
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748B' }}>Nội dung:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong style={{ color: '#E11D48' }}>{receiverAccount.content}</strong>
                              <button
                                  type="button"
                                  onClick={() => handleCopy(receiverAccount.content, 'CONTENT')}
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    border: '1px solid #CBD5E1',
                                    background: '#F8FAFC',
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
                        <div style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: '0.75rem' }}>
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
                                      border: isSelected ? '2px solid #E11D48' : '1px solid #E2E8F0',
                                      backgroundColor: isSelected ? '#FFF1F2' : '#ffffff',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.65rem',
                                    }}
                                >
                                  {/* Sửa lại khung hiển thị logo để không bị lỗi trắng/trống */}
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
                                              background: '#ffffff',
                                              borderRadius: 7,
                                              padding: 4,
                                              border: '1px solid #e2e8f0',
                                            }}
                                            onError={(e) => {
                                              const image = e.currentTarget;
                                              image.style.display = 'none';
                                              const fallback = image.nextElementSibling as HTMLElement | null;
                                              if (fallback) fallback.style.display = 'flex';
                                            }}
                                        />
                                        <div style={{ display: 'none', width: 42, height: 30, flex: '0 0 42px', alignItems: 'center', justifyContent: 'center', borderRadius: 7, background: '#F1F5F9', color: '#475569', fontSize: '0.68rem', fontWeight: 800, border: '1px solid #E2E8F0' }}>
                                          {bank.code}
                                        </div>
                                      </>
                                  ) : (
                                      <div
                                          style={{
                                            width: 42,
                                            height: 30,
                                            flex: '0 0 42px',
                                            background: '#e2e8f0',
                                            borderRadius: 4,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                          }}
                                      >
                                        {bank.code}
                                      </div>
                                  )}
                                  <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                    <div
                                        style={{
                                          fontWeight: 700,
                                          fontSize: '0.84rem',
                                          color: '#1E293B',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                    >
                                      {bank.shortName}
                                    </div>
                                    <div
                                        style={{
                                          fontSize: '0.7rem',
                                          color: '#64748B',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                    >
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

                {/* Thanh chọn chế độ Test */}
                <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.9rem', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 10, display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 600, color: '#475569' }}>Giả lập trạng thái sau khi bấm Đặt phòng:</span>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{ cursor: 'pointer', color: '#15803D', fontWeight: 600 }}><input type="radio" checked={simulateOutcome === 'SUCCESS'} onChange={() => setSimulateOutcome('SUCCESS')} /> Thành công (PAID)</label>
                    <label style={{ cursor: 'pointer', color: '#B91C1C', fontWeight: 600 }}><input type="radio" checked={simulateOutcome === 'FAILED'} onChange={() => setSimulateOutcome('FAILED')} /> Thất bại (FAILED)</label>
                  </div>
                </div>
              </Card>

              <Card title="Chính sách hủy phòng">
                <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>Hủy miễn phí trước 48 giờ so với thời điểm nhận phòng. Sau thời gian này, việc hủy phòng sẽ tuân theo thỏa thuận trực tiếp cùng chủ nhà.</p>
              </Card>
            </div>

            {/* CỘT PHẢI */}
            <aside style={{ position: 'sticky', top: '6rem' }}>
              <Card variant="elevated">
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.25rem', marginBottom: '1rem' }}>
                  <img src={property.image} alt={property.name} style={{ width: 92, height: 84, borderRadius: 10, objectFit: 'cover' }} />
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block' }}>{property.type} · {property.city}</span>
                    <strong style={{ fontSize: '0.98rem', display: 'block', margin: '0.2rem 0' }}>{property.name}</strong>
                    <span style={{ fontSize: '0.84rem', color: '#475569', display: 'block' }}>Hạng phòng: {room.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', marginTop: 4 }}>
                      <StarFill style={{ fontSize: '0.75rem', color: '#E11D48' }} />
                      <strong>{property.rating ? property.rating.toFixed(2) : '4.80'}</strong>
                      <span style={{ color: '#64748B' }}>(18 đánh giá)</span>
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
                        background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
                        border: '1px solid #A7F3D0',
                        color: '#047857',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'help',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)',
                        transition: 'all 0.2s ease',
                      }}
                  >
                    <ShieldCheck
                        style={{
                          fontSize: '1rem',
                          color: '#059669',
                          flexShrink: 0,
                        }}
                    />
                    <span>Bảo vệ quyền lợi khách hàng</span>
                    <span
                        style={{
                          width: 16,
                          height: 16,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          background: '#A7F3D0',
                          color: '#047857',
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                    >i</span>
                  </div>
                </div>


                <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 55%, #FFF1F2 100%)', borderRadius: 16, padding: '1rem', border: '1px solid #E2E8F0', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: '0.9rem' }}>
                    <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>Thông tin kỳ nghỉ</strong>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', color: '#BE123C', background: 'rgba(255,255,255,0.8)', border: '1px solid #FECDD3', borderRadius: 999, padding: '4px 8px' }}>YOUR STAY</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(226,232,240,0.9)', borderRadius: 12, padding: '0.75rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', color: '#64748B', fontSize: '0.72rem', marginBottom: 4 }}>NHẬN PHÒNG</span>
                      <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.9rem' }}>{checkIn}</strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#E11D48', fontSize: '0.68rem', fontWeight: 700 }}>
                      <span style={{ width: 28, height: 1, background: '#FDA4AF' }} />
                      <span style={{ whiteSpace: 'nowrap', margin: '4px 0' }}>{nights} ĐÊM</span>
                      <span style={{ width: 28, height: 1, background: '#FDA4AF' }} />
                    </div>
                    <div style={{ minWidth: 0, textAlign: 'right' }}>
                      <span style={{ display: 'block', color: '#64748B', fontSize: '0.72rem', marginBottom: 4 }}>TRẢ PHÒNG</span>
                      <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.9rem' }}>{checkOut}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: '0.75rem', padding: '0.2rem 0.1rem 0' }}>
                    <span style={{ color: '#64748B' }}>Số lượng khách</span>
                    <strong style={{ color: '#1E293B' }}>{guests} khách <span style={{ color: '#94A3B8', fontWeight: 500 }}>/ tối đa {room.capacity}</span></strong>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.02rem', fontWeight: 750, margin: '0 0 0.8rem', color: '#0F172A' }}>Chi tiết thanh toán</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}><span>Giá phòng · {nights} đêm</span><strong style={{ color: '#334155' }}>{formatVND(subtotal)}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}><span>Phí dịch vụ</span><strong style={{ color: '#059669' }}>Miễn phí</strong></div>
                  {paymentMethod === 'cod' ? (
                      <div style={{ marginTop: 4, padding: '0.85rem 0.9rem', borderRadius: 12, background: 'linear-gradient(120deg, #FFFBEB, #FFF7ED)', border: '1px solid #FCD34D' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#92400E' }}>Cần đặt cọc ngay (30%)</span>
                          <strong style={{ fontSize: '1.12rem', color: '#E11D48', whiteSpace: 'nowrap' }}>{formatVND(depositAmount)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.78rem', color: '#92400E', marginTop: 7 }}>
                          <span>Còn lại khi nhận phòng (70%)</span><strong>{formatVND(remainingAtHotel)}</strong>
                        </div>
                      </div>
                  ) : (
                      <div style={{ marginTop: 4, padding: '0.85rem 0.9rem', borderRadius: 12, background: 'linear-gradient(120deg, #FFF1F2, #FFF7F8)', border: '1px solid #FECDD3' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#BE123C' }}>Tổng thanh toán</span>
                          <strong style={{ fontSize: '1.12rem', color: '#E11D48', whiteSpace: 'nowrap' }}>{formatVND(totalAmount)}</strong>
                        </div>
                      </div>
                  )}
                </div>

                <div style={{ marginTop: '1.25rem' }}>
                  <Button type="submit" variant="primary" size="lg" disabled={!quote.success} icon={<CalendarCheck />} style={{ width: '100%', justifyContent: 'center' }}>
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