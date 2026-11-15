// ODauDay Stay — Airbnb Vietnam Exact Homepage Layout & Micro-Animations (TypeScript)
import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { PropertyCard } from '../../components/UI';
import SearchBar from '../../components/SearchBar';
import { ChevronLeft, ChevronRight, X } from 'react-bootstrap-icons';
import { Property } from '../../data';
import { stayApi } from '../../api/stayApi';
import { useQuery } from '../../hooks/useQuery';

export default function HomePage() {
  const { store } = useStore();

  const [kw] = useState('');
  const [checkIn] = useState('');
  const [checkOut] = useState('');
  const [guests] = useState('');
  const [showFeeBadge, setShowFeeBadge] = useState(true);

  // Hàm fetch danh sách phòng và đánh giá từ Backend
  const fetchPropertiesWithReviews = useCallback(async (): Promise<Property[]> => {
    try {
      const [resProps, resRevs] = await Promise.all([
        stayApi.getProperties(),
        stayApi.getReviews().catch(() => ({ success: false, data: [] })),
      ]);

      if (resProps.success && Array.isArray(resProps.data) && resProps.data.length > 0) {
        const revs = resRevs.success && Array.isArray(resRevs.data) ? resRevs.data : [];
        return resProps.data.map(p => {
          const propReviews = revs.filter(r => Number(r.propertyId) === Number(p.id));
          const isGuestFavorite = Boolean(
            p.isGuestFavorite !== undefined ? p.isGuestFavorite : p.badge === 'Yêu thích nhất'
          );
          const isTrending = Boolean(
            p.isTrending !== undefined ? p.isTrending : (p.badge === 'Đang Hot' || p.badge === 'Mới ra mắt')
          );
          const isHot = Boolean(p.isHot !== undefined ? p.isHot : (isTrending || p.badge === 'Đang Hot'));

          if (propReviews.length > 0) {
            const sum = propReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
            const avg = Math.round((sum / propReviews.length) * 10) / 10;
            return {
              ...p,
              rating: avg,
              averageRating: avg,
              reviewsCount: propReviews.length,
              reviewCount: propReviews.length,
              isGuestFavorite,
              isTrending,
              isHot,
            };
          }

          if (p.reviewsCount && p.reviewsCount > 0 && p.rating && p.rating > 0) {
            return {
              ...p,
              isGuestFavorite,
              isTrending,
              isHot,
            };
          }

          return {
            ...p,
            rating: null,
            averageRating: null,
            reviewsCount: 0,
            reviewCount: 0,
            isGuestFavorite,
            isTrending,
            isHot,
          };
        });
      }
    } catch (err) {
      console.warn('Lỗi khi fetch danh sách phòng:', err);
    }

    return store.getData().properties || [];
  }, [store]);

  // Thay thế useEffect fetch data cũ bằng React Query (useQuery) hỗ trợ Polling mỗi 30 giây
  // keepPreviousData: true giúp giao diện giữ nguyên không bị giật lác (anti-flicker) khi fetch ngầm
  const { data: properties = store.getData().properties || [] } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: fetchPropertiesWithReviews,
    refetchInterval: 30000, // Tự động refetch API ngầm mỗi 30 giây
    keepPreviousData: true,
  });

  // Khu vực 1: Lọc danh sách phòng Hot / Xu hướng hiện nay (isHot hoặc isTrending từ Backend)
  const hotProperties = useMemo(() => {
    const filtered = properties.filter(
      p =>
        p.isHot === true ||
        p.isTrending === true ||
        p.badge === 'Yêu thích nhất' ||
        p.badge === 'Đang Hot'
    );
    // Fallback nếu chưa có cờ: lấy top phòng có rating cao nhất hoặc 5 phòng nổi bật
    return filtered.length > 0 ? filtered : properties.slice(0, 5);
  }, [properties]);

  // Khu vực 2: Các phòng còn lại hiển thị ở dạng Grid truyền thống ("Khám phá chỗ ở")
  const exploreProperties = useMemo(() => {
    const hotIds = new Set(hotProperties.map(p => p.id));
    const remaining = properties.filter(p => !hotIds.has(p.id));
    return remaining.length > 0 ? remaining : properties;
  }, [properties, hotProperties]);

  // Ref và hàm cuộn ngang cho Carousel Phòng Hot
  const hotScrollRef = useRef<HTMLDivElement>(null);

  const scrollHotLeft = () => {
    if (hotScrollRef.current) {
      const scrollStep = hotScrollRef.current.clientWidth * 0.75;
      hotScrollRef.current.scrollBy({ left: -scrollStep, behavior: 'smooth' });
    }
  };

  const scrollHotRight = () => {
    if (hotScrollRef.current) {
      const scrollStep = hotScrollRef.current.clientWidth * 0.75;
      hotScrollRef.current.scrollBy({ left: scrollStep, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ maxWidth: 1760, margin: '0 auto', padding: '0 2.5rem 6rem' }}>
      {/* Big Hero Search Bar (Shared SearchBar Component) */}
      <div style={{ margin: '0.5rem auto 3rem', maxWidth: 880 }}>
        <SearchBar
          variant="hero"
          initialKw={kw}
          initialCheckIn={checkIn}
          initialCheckOut={checkOut}
          initialGuests={guests}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          KHU VỰC 1: 🔥 Xu hướng hiện nay (Phòng Hot) - Horizontal Carousel
          ───────────────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: '1.5rem' }}>
        {/* Section Header */}
        <div
          className="flex items-center justify-between mb-5 flex-wrap gap-2"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <h2
              className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 m-0"
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--color-text-primary, #0F172A)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>🔥 Xu hướng hiện nay</span>
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: '#FFF1F2',
                  color: '#E11D48',
                  border: '1px solid #FECDD3',
                }}
              >
                Phòng Hot
              </span>
            </h2>
            <p
              className="text-sm text-slate-500 mt-1 mb-0"
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary, #475569)',
                margin: '0.35rem 0 0',
              }}
            >
              Những chỗ ở được đặt nhiều nhất và quan tâm đặc biệt trong tuần qua
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Desktop Navigation Scroll Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={scrollHotLeft}
                aria-label="Cuộn sang trái"
                className="w-8 h-8 rounded-full border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-50 hover:scale-105 transition-all shadow-sm"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: '1px solid var(--color-border-strong, #CBD5E1)',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-primary, #0F172A)',
                  boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--color-text-primary, #0F172A)';
                  e.currentTarget.style.transform = 'scale(1.06)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border-strong, #CBD5E1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <ChevronLeft style={{ fontSize: '0.85rem' }} />
              </button>

              <button
                type="button"
                onClick={scrollHotRight}
                aria-label="Cuộn sang phải"
                className="w-8 h-8 rounded-full border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-50 hover:scale-105 transition-all shadow-sm"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: '1px solid var(--color-border-strong, #CBD5E1)',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-primary, #0F172A)',
                  boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--color-text-primary, #0F172A)';
                  e.currentTarget.style.transform = 'scale(1.06)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border-strong, #CBD5E1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <ChevronRight style={{ fontSize: '0.85rem' }} />
              </button>
            </div>

            {/* Nút Xem thêm */}
            <Link
              to="/rooms?filter=hot"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:text-rose-700 hover:underline px-3 py-1.5 rounded-full hover:bg-rose-50 transition-colors"
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--color-primary, #FF385C)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '9999px',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary-soft, #FFF1F2)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span>Xem thêm</span>
              <ChevronRight style={{ fontSize: '0.8rem' }} />
            </Link>
          </div>
        </div>

        {/* Thanh trượt ngang (Horizontal Scroll / Carousel) */}
        <div
          ref={hotScrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4 pt-1 scroll-smooth"
          style={{
            display: 'flex',
            gap: '1.25rem',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingBottom: '0.75rem',
            paddingTop: '0.25rem',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {hotProperties.map(property => (
            <div
              key={property.id}
              className="flex-none snap-start"
              style={{
                flex: '0 0 auto',
                width: 'clamp(270px, 28vw, 320px)',
                scrollSnapAlign: 'start',
              }}
            >
              <PropertyCard
                property={property}
                checkIn={checkIn}
                checkOut={checkOut}
                guests={guests}
                nights={2}
                isHotSection={true}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          ĐƯỜNG KẺ NGANG (DIVIDER) TINH TẾ
          ───────────────────────────────────────────────────────────────── */}
      <div
        className="my-10 border-t border-slate-200"
        style={{
          margin: '3rem 0 2.5rem',
          borderTop: '1px solid var(--color-border-subtle, #E2E8F0)',
        }}
      />

      {/* ─────────────────────────────────────────────────────────────────
          KHU VỰC 2: Khám phá chỗ ở - Grid truyền thống
          ───────────────────────────────────────────────────────────────── */}
      <section>
        {/* Section Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2
            className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight m-0"
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-text-primary, #0F172A)',
              margin: 0,
            }}
          >
            Khám phá chỗ ở
          </h2>
          <p
            className="text-sm text-slate-500 mt-1 mb-0"
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary, #475569)',
              margin: '0.35rem 0 0',
            }}
          >
            Bộ sưu tập chỗ nghỉ đa dạng trên khắp các điểm đến nổi tiếng Việt Nam
          </p>
        </div>

        {/* Clean Responsive Grid (Desktop 4-5 cột, Tablet 2-3 cột, Mobile 1 cột) */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '2.5rem 1.25rem',
          }}
        >
          {exploreProperties.map(property => (
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
      </section>

      {/* Floating Bottom Pill: "Giá đã bao gồm mọi khoản phí" with dismiss */}
      {showFeeBadge && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 90,
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--color-border-strong, #CBD5E1)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
            borderRadius: '9999px',
            padding: '0.65rem 1.15rem 0.65rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.88rem',
            fontWeight: 600,
            color: 'var(--color-text-primary, #0F172A)',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <span style={{ fontSize: '1rem' }}>🏷️</span>
          <span>Giá đã bao gồm mọi khoản phí</span>
          <button
            type="button"
            onClick={() => setShowFeeBadge(false)}
            aria-label="Đóng thông báo"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary, #475569)',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '0.25rem',
            }}
          >
            <X style={{ fontSize: '1.1rem' }} />
          </button>
        </div>
      )}
    </div>
  );
}
