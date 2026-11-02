// Airbnb Vietnam Exact Search Results Page (TypeScript)
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { PropertyCard, Alert } from '../../components/UI';
import SearchBar from '../../components/SearchBar';
import {
  Search,
  Sliders,
  HouseDoor,
  ExclamationCircle,
} from 'react-bootstrap-icons';
import { Property } from '../../data';

const TYPES = ['Tất cả', 'Homestay', 'Biệt thự', 'Căn hộ', 'Nhà gỗ'];

export default function SearchResultsPage() {
  const { store } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [kw, setKw] = useState(searchParams.get('kw') || '');
  const [checkIn, setCheckIn] = useState(searchParams.get('in') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('out') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '');
  const [type, setType] = useState('Tất cả');
  const [maxPrice, setMaxPrice] = useState(3000000);
  const [showFilters, setShowFilters] = useState(false);
  const [showTaxes, setShowTaxes] = useState(false);

  useEffect(() => {
    setKw(searchParams.get('kw') || '');
    setCheckIn(searchParams.get('in') || '');
    setCheckOut(searchParams.get('out') || '');
    setGuests(searchParams.get('guests') || '');
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p: Record<string, string> = {};
    if (kw.trim()) p.kw = kw.trim();
    if (checkIn) p.in = checkIn;
    if (checkOut) p.out = checkOut;
    if (guests) p.guests = guests;
    setSearchParams(p);
  };

  // Perform store query
  const searchResult = store.search({
    kw,
    checkIn,
    checkOut,
    type,
    maxPrice,
  });

  const properties: Property[] = searchResult.properties || [];
  const isDateError = !searchResult.success && searchResult.code === 'INVALID_DATES';
  const isEmpty = searchResult.success && properties.length === 0;

  return (
    <div style={{ maxWidth: 1760, margin: '1rem auto 4rem', padding: '0 2.5rem' }}>
      {/* Top Filter & Toggle Bar */}
      <div
        style={{
          borderBottom: '1px solid #EBEBEB',
          paddingBottom: '1.25rem',
          marginBottom: '1.75rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}
        >
          {/* Shared Reusable SearchBar (Compact Variant) */}
          <SearchBar
            initialKw={kw}
            initialCheckIn={checkIn}
            initialCheckOut={checkOut}
            initialGuests={guests}
            variant="compact"
            onSearch={({ kw: newKw, checkIn: newIn, checkOut: newOut, guests: newGuests }) => {
              const p: Record<string, string> = { in: newIn, out: newOut, guests: newGuests };
              if (newKw.trim()) p.kw = newKw.trim();
              setSearchParams(p);
            }}
          />

            {/* Filter Toggle and Tax Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                style={{
                  border: '1px solid #DDDDDD',
                  borderRadius: '9999px',
                  padding: '0.6rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: '#ffffff',
                  cursor: 'pointer',
                  color: '#222',
                }}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Sliders />
                <span>Bộ lọc {type !== 'Tất cả' || maxPrice < 3000000 ? '• 1+' : ''}</span>
              </button>

              {/* Tax Toggle (Airbnb Feature) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  border: '1px solid #DDDDDD',
                  borderRadius: '9999px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: '#ffffff',
                  color: '#222',
                }}
              >
                <span>Hiển thị tổng giá trước thuế</span>
                <input
                  type="checkbox"
                  checked={showTaxes}
                  onChange={e => setShowTaxes(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#222', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* Filter details collapse */}
          {showFilters && (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1.25rem',
                background: '#F7F7F7',
                borderRadius: '16px',
                display: 'flex',
                gap: '2rem',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: '#222' }}>
                  Loại hình chỗ ở:
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      style={{
                        padding: '0.4rem 1rem',
                        borderRadius: '9999px',
                        border: type === t ? '1px solid #222222' : '1px solid #DDDDDD',
                        background: type === t ? '#222222' : '#ffffff',
                        color: type === t ? '#ffffff' : '#222222',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                      onClick={() => setType(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ minWidth: 260 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.4rem', color: '#222' }}>
                  <span>Mức giá tối đa:</span>
                  <span style={{ color: '#FF385C' }}>
                    {new Intl.NumberFormat('vi-VN').format(maxPrice)} ₫
                  </span>
                </div>
                <input
                  type="range"
                  min="500000"
                  max="3000000"
                  step="100000"
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#FF385C', cursor: 'pointer' }}
                />
              </div>

              <button
                type="button"
                style={{
                  marginLeft: 'auto',
                  alignSelf: 'flex-end',
                  background: 'transparent',
                  border: 'none',
                  textDecoration: 'underline',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  color: '#222',
                }}
                onClick={() => {
                  setType('Tất cả');
                  setMaxPrice(3000000);
                  setKw('');
                }}
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
      </div>

      {/* Date Validation Notice */}
      {isDateError && (
        <div style={{ margin: '2rem 0' }}>
          <Alert type="error" title="Ngày lưu trú không hợp lệ">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ExclamationCircle style={{ fontSize: '1.2rem', flexShrink: 0 }} />
              <span>{searchResult.message || 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.'}</span>
            </div>
          </Alert>
        </div>
      )}

      {/* Results Header */}
      {!isDateError && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0, color: '#222' }}>
            {properties.length > 0
              ? `Hơn ${properties.length} chỗ ở ${kw ? `tại "${kw}"` : 'ở Việt Nam'}`
              : 'Không tìm thấy chỗ ở nào'}
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#717171', fontSize: '0.9rem' }}>
            Giá đã bao gồm mọi khoản phí theo tiêu chuẩn hiển thị ODauDay Stay
          </p>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <HouseDoor style={{ fontSize: '3rem', color: '#B0B0B0', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#222' }}>Không có chỗ ở nào khớp với tiêu chí</h3>
          <p style={{ color: '#717171', maxWidth: 450, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            Hãy thử tìm kiếm với các địa điểm nổi tiếng như "Hồ Tây" hoặc "Ba Vì", hoặc đặt lại bộ lọc giá.
          </p>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setKw('');
              setType('Tất cả');
              setMaxPrice(3000000);
              setCheckIn('2027-01-10');
              setCheckOut('2027-01-12');
            }}
          >
            Xem tất cả chỗ ở
          </button>
        </div>
      )}

      {/* Clean Airbnb Results Grid (Responsive 4 - 6 columns) */}
      {!isDateError && !isEmpty && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '2.5rem 1.25rem',
          }}
        >
          {properties.map(property => (
            <PropertyCard
              key={property.id}
              property={property}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              nights={2}
            />
          ))}
        </div>
      )}
    </div>
  );
}
