// Airbnb Vietnam Exact Search Results Page (TypeScript)
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { PropertyCard, Alert } from '../../components/UI';
import SearchBar from '../../components/SearchBar';
import {
  Search,
  Sliders,
  HouseDoor,
  ExclamationCircle,
  Fire,
} from 'react-bootstrap-icons';
import { Property, Review } from '../../data';
import { stayApi } from '../../api/stayApi';

const TYPES = ['Tất cả', 'Homestay', 'Biệt thự', 'Căn hộ', 'Nhà gỗ'];

export default function SearchResultsPage() {
  const { store } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const filter = searchParams.get('filter') || '';
  const isHotFilter = filter === 'hot';

  const [kw, setKw] = useState(searchParams.get('kw') || '');
  const [checkIn, setCheckIn] = useState(searchParams.get('in') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('out') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '');
  const [type, setType] = useState('Tất cả');
  const [maxPrice, setMaxPrice] = useState(3000000);
  const [showFilters, setShowFilters] = useState(false);
  const [showTaxes, setShowTaxes] = useState(false);

  // Dữ liệu thực từ Backend API (thay thế hoàn toàn mảng fix cứng)
  const [backendProperties, setBackendProperties] = useState<Property[]>([]);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setKw(searchParams.get('kw') || '');
    setCheckIn(searchParams.get('in') || '');
    setCheckOut(searchParams.get('out') || '');
    setGuests(searchParams.get('guests') || '');
  }, [searchParams]);

  // Fetch dữ liệu từ Backend API
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      stayApi.getProperties(),
      stayApi.getReviews().catch(() => ({ success: false, data: [] as Review[] })),
    ])
      .then(([propsRes, revsRes]) => {
        if (!isMounted) return;
        if (propsRes && propsRes.success && Array.isArray(propsRes.data) && propsRes.data.length > 0) {
          setBackendProperties(propsRes.data);
        } else {
          const localProps = store ? store.getData().properties : [];
          setBackendProperties(localProps || []);
        }

        if (revsRes && revsRes.success && Array.isArray(revsRes.data)) {
          setReviewsList(revsRes.data);
        } else {
          const localRevs = store ? store.getData().reviews : [];
          setReviewsList(localRevs || []);
        }
      })
      .catch(err => {
        console.error('Lỗi khi tải dữ liệu chỗ ở từ backend:', err);
        if (!isMounted) return;
        const localProps = store ? store.getData().properties : [];
        const localRevs = store ? store.getData().reviews : [];
        setBackendProperties(localProps || []);
        setReviewsList(localRevs || []);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [store]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p: Record<string, string> = {};
    if (kw.trim()) p.kw = kw.trim();
    if (checkIn) p.in = checkIn;
    if (checkOut) p.out = checkOut;
    if (guests) p.guests = guests;
    setSearchParams(p);
  };

  // Kiểm tra tính hợp lệ của ngày đặt phòng
  const isDateError = Boolean(checkIn && checkOut && new Date(checkOut) <= new Date(checkIn));

  // Lọc và ánh xạ rating từ dữ liệu Backend API
  const properties: Property[] = useMemo(() => {
    if (isDateError) return [];

    const kwLower = kw.toLowerCase().trim();
    const maxP = typeof maxPrice === 'number' ? maxPrice : parseInt(String(maxPrice || ''), 10) || Infinity;

    const filtered = backendProperties.filter(p => {
      const matchKw =
        !kwLower ||
        p.name?.toLowerCase().includes(kwLower) ||
        p.address?.toLowerCase().includes(kwLower) ||
        p.city?.toLowerCase().includes(kwLower) ||
        (p.area || '').toLowerCase().includes(kwLower);

      const matchType = type === 'Tất cả' || p.type === type;
      const matchPrice = (p.priceMin || 0) <= maxP;
      const isActive = p.status === 'ACTIVE' || !p.status;

      // Lọc danh sách phòng theo filter=hot nếu được yêu cầu từ URL
      const isHotProperty = Boolean(
        p.isHot === true ||
        p.isTrending === true ||
        p.badge === 'Đang Hot' ||
        p.badge === 'Yêu thích nhất'
      );
      const matchFilter = !isHotFilter || isHotProperty;

      return matchKw && matchType && matchPrice && isActive && matchFilter;
    });

    return filtered.map(p => {
      // Tìm các đánh giá tương ứng từ backend reviews
      const propReviews = reviewsList.filter(r => Number(r.propertyId) === Number(p.id));

      let finalRating: number | null = null;
      let finalReviewsCount = 0;

      if (propReviews.length > 0) {
        const sum = propReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
        finalRating = Math.round((sum / propReviews.length) * 10) / 10;
        finalReviewsCount = propReviews.length;
      } else if (p.reviewsCount && p.reviewsCount > 0 && p.rating && p.rating > 0) {
        finalRating = Math.round(Number(p.rating) * 10) / 10;
        finalReviewsCount = p.reviewsCount;
      } else {
        // Chưa có đánh giá nào -> Bắt buộc truyền null để PropertyCard tự động hiển thị chữ 'Mới'
        finalRating = null;
        finalReviewsCount = 0;
      }

      // Xác định cờ boolean cho nhãn dán từ API / DB
      const isGuestFavorite = Boolean(
        p.isGuestFavorite !== undefined ? p.isGuestFavorite : p.badge === 'Yêu thích nhất'
      );
      const isTrending = Boolean(
        isHotFilter ||
        (p.isTrending !== undefined ? p.isTrending : (p.badge === 'Đang Hot' || p.badge === 'Mới ra mắt'))
      );
      const isHot = Boolean(isHotFilter || p.isHot === true || isTrending || p.badge === 'Đang Hot');

      return {
        ...p,
        rating: finalRating,
        averageRating: finalRating,
        reviewsCount: finalReviewsCount,
        reviewCount: finalReviewsCount,
        isGuestFavorite,
        isTrending,
        isHot,
      };
    });
  }, [backendProperties, reviewsList, kw, type, maxPrice, isDateError, isHotFilter]);

  const isEmpty = !isLoading && !isDateError && properties.length === 0;

  return (
    <div style={{ maxWidth: 1760, margin: '1rem auto 4rem', padding: '0 2.5rem' }}>
      {/* Top Filter & Toggle Bar */}
      <div
        style={{
          borderBottom: '1px solid var(--color-border-subtle)',
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
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: '9999px',
                  padding: '0.6rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: 'var(--color-bg-surface)',
                  cursor: 'pointer',
                  color: 'var(--color-text-primary)',
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
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: '9999px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: 'var(--color-bg-surface)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <span>Hiển thị tổng giá trước thuế</span>
                <input
                  type="checkbox"
                  checked={showTaxes}
                  onChange={e => setShowTaxes(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--color-text-primary)', cursor: 'pointer' }}
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
                background: 'var(--color-bg-app)',
                borderRadius: '16px',
                display: 'flex',
                gap: '2rem',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--color-text-primary)' }}>
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
                        border: type === t ? '1px solid var(--color-text-primary)' : '1px solid var(--color-border-strong)',
                        background: type === t ? 'var(--color-text-primary)' : 'var(--color-bg-surface)',
                        color: type === t ? 'var(--color-bg-surface)' : 'var(--color-text-primary)',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--color-text-primary)' }}>
                  <span>Mức giá tối đa:</span>
                  <span style={{ color: 'var(--color-primary)' }}>
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
                  style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
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
                  color: 'var(--color-text-primary)',
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
              <span>Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.</span>
            </div>
          </Alert>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="spinner-border text-danger" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Đang tải dữ liệu chỗ ở thực tế từ hệ thống...
          </p>
        </div>
      )}

      {/* Results Header */}
      {!isLoading && !isDateError && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {isHotFilter ? (
              <>
                <span>🔥 Xu hướng hiện nay — Phòng đang Hot</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    backgroundColor: '#FEE2E2',
                    color: '#991B1B',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Fire style={{ color: '#DC2626', fontSize: '0.85rem' }} />
                  {properties.length} chỗ ở Hot
                </span>
              </>
            ) : properties.length > 0 ? (
              `Hơn ${properties.length} chỗ ở ${kw ? `tại "${kw}"` : 'ở Việt Nam'}`
            ) : (
              'Không tìm thấy chỗ ở nào'
            )}
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            {isHotFilter
              ? 'Những chỗ ở được săn đón nhiều nhất, có lượt booking cao và thu hút đông đảo khách du lịch'
              : 'Giá đã bao gồm mọi khoản phí theo tiêu chuẩn hiển thị ODauDay Stay'}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && isEmpty && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <HouseDoor style={{ fontSize: '3rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Không có chỗ ở nào khớp với tiêu chí</h3>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: 450, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
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
      {!isLoading && !isDateError && !isEmpty && (
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
