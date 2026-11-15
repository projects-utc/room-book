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

  // Khu vực 2: Danh sách phòng ở mục "Khám phá chỗ ở" - Giữ đầy đủ tất cả phòng (thẻ phòng xu hướng vẫn có ở đây)
  const exploreProperties = properties;

  // Ref và hàm cuộn ngang cho Phòng Hot ("nếu có nhiều thì cho lướt sang bên")
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

  // Phân trang cho "Khám phá chỗ ở": 2 hàng (10 phòng mỗi trang với 5 cột)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(exploreProperties.length / itemsPerPage));

  const paginatedExploreProperties = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return exploreProperties.slice(start, start + itemsPerPage);
  }, [exploreProperties, currentPage, itemsPerPage]);

  const exploreSectionRef = useRef<HTMLElement>(null);

  const handlePrevPage = () => {
    setCurrentPage(prev => {
      const next = Math.max(prev - 1, 1);
      if (next !== prev && exploreSectionRef.current) {
        exploreSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return next;
    });
  };

  const handleNextPage = () => {
    setCurrentPage(prev => {
      const next = Math.min(prev + 1, totalPages);
      if (next !== prev && exploreSectionRef.current) {
        exploreSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return next;
    });
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
          KHU VỰC 1: 🔥 Xu hướng hiện nay (Phòng Hot) - Lướt ngang nếu nhiều phòng, thẻ chuẩn kích thước
          ───────────────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: '1.5rem' }}>
        {/* Section Header */}
        <div
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
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary, #475569)',
                margin: '0.35rem 0 0',
              }}
            >
              Những chỗ ở được đặt nhiều nhất và quan tâm đặc biệt trong tuần qua
            </p>
          </div>

          {/* Nút lướt sang bên nếu có nhiều phòng xu hướng */}
          {hotProperties.length > 5 && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={scrollHotLeft}
                aria-label="Cuộn sang trái"
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
              >
                <ChevronLeft style={{ fontSize: '0.85rem' }} />
              </button>
              <button
                type="button"
                onClick={scrollHotRight}
                aria-label="Cuộn sang phải"
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
              >
                <ChevronRight style={{ fontSize: '0.85rem' }} />
              </button>
            </div>
          )}
        </div>

        {/* Thanh trượt ngang lướt sang bên, kích thước thẻ bằng 100% thẻ dưới */}
        <div ref={hotScrollRef} className="trending-slider">
          {hotProperties.map(property => (
            <div key={property.id} className="trending-card-item">
              <PropertyCard
                property={property}
                checkIn={checkIn}
                checkOut={checkOut}
                guests={guests}
                nights={2}
                isHotSection={true}
                aspectRatio="16 / 10"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          ĐƯỜNG KẺ NGANG (DIVIDER) TINH TẾ
          ───────────────────────────────────────────────────────────────── */}
      <div
        style={{
          margin: '2.5rem 0 2rem',
          borderTop: '1px solid var(--color-border-subtle, #E2E8F0)',
        }}
      />

      {/* ─────────────────────────────────────────────────────────────────
          KHU VỰC 2: Khám phá chỗ ở - 2 Hàng hiển thị hết nội dung + Chuyển trang & Xem thêm
          ───────────────────────────────────────────────────────────────── */}
      <section ref={exploreSectionRef}>
        {/* Section Header có bộ điều khiển chuyển trang và Xem thêm */}
        <div
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
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary, #475569)',
                margin: '0.35rem 0 0',
              }}
            >
              Bộ sưu tập chỗ nghỉ đa dạng trên khắp các điểm đến nổi tiếng Việt Nam
            </p>
          </div>

          {/* Nút Xem thêm đưa xuống Khám phá chỗ ở (đã bỏ nút chuyển trang ở đây vì cuối trang đã có) */}
          <Link
            to="/rooms"
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--color-primary, #FF385C)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.85rem',
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

        {/* Grid hiển thị chính xác 2 hàng (10 đơn), tỷ lệ hiển thị đầy đủ mọi nội dung không bị cắt */}
        <div className="explore-property-grid">
          {paginatedExploreProperties.map(property => (
            <PropertyCard
              key={property.id}
              property={property}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              nights={2}
              aspectRatio="16 / 10"
            />
          ))}
        </div>

        {/* Thanh số trang chuyển trang bên dưới */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '2.5rem',
            }}
          >
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              style={{
                padding: '0.5rem 0.95rem',
                borderRadius: '10px',
                border: '1px solid var(--color-border-strong, #CBD5E1)',
                background: '#FFFFFF',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.45 : 1,
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--color-text-primary, #0F172A)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
              }}
            >
              <ChevronLeft style={{ fontSize: '0.8rem' }} /> Trước
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                type="button"
                onClick={() => {
                  setCurrentPage(page);
                  if (exploreSectionRef.current) {
                    exploreSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                style={{
                  minWidth: 38,
                  height: 38,
                  padding: '0 8px',
                  borderRadius: '10px',
                  border: page === currentPage ? 'none' : '1px solid var(--color-border-subtle, #E2E8F0)',
                  background: page === currentPage ? 'var(--color-primary, #E11D48)' : '#FFFFFF',
                  color: page === currentPage ? '#FFFFFF' : 'var(--color-text-primary, #0F172A)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: page === currentPage ? '0 2px 8px rgba(225, 29, 72, 0.3)' : 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
                  transition: 'all 0.15s ease',
                }}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              style={{
                padding: '0.5rem 0.95rem',
                borderRadius: '10px',
                border: '1px solid var(--color-border-strong, #CBD5E1)',
                background: '#FFFFFF',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.45 : 1,
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--color-text-primary, #0F172A)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
              }}
            >
              Sau <ChevronRight style={{ fontSize: '0.8rem' }} />
            </button>
          </div>
        )}
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
