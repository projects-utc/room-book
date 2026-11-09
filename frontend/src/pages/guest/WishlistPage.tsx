// Wishlist (Saved Properties) Page — Airbnb Luxury Design (TypeScript)
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { PropertyCard } from '../../components/UI';
import { Heart, HeartFill, Compass, Trash, ChevronRight } from 'react-bootstrap-icons';
import { Property, Review } from '../../data';
import { stayApi } from '../../api/stayApi';

const WISHLIST_STORAGE_KEY = 'odd_wishlist_ids';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { store } = useStore();

  const [wishlistProperties, setWishlistProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    // Chuẩn bị sẵn logic gọi API thực tế kèm fallback localStorage / mock
    Promise.all([
      stayApi.getProperties(),
      stayApi.getReviews().catch(() => ({ success: false, data: [] as Review[] })),
    ])
      .then(([propsRes, revsRes]) => {
        if (!isMounted) return;

        const allProps: Property[] =
          propsRes && propsRes.success && Array.isArray(propsRes.data) && propsRes.data.length > 0
            ? propsRes.data
            : (store ? store.getData().properties : []);

        const revs: Review[] =
          revsRes && revsRes.success && Array.isArray(revsRes.data)
            ? revsRes.data
            : (store ? store.getData().reviews : []);

        // Chuẩn hóa rating & reviews cho từng property
        const mappedProps = allProps.map(p => {
          const propReviews = revs.filter(r => Number(r.propertyId) === Number(p.id));
          const isGuestFavorite = Boolean(
            p.isGuestFavorite !== undefined ? p.isGuestFavorite : p.badge === 'Yêu thích nhất'
          );
          const isTrending = Boolean(
            p.isTrending !== undefined ? p.isTrending : (p.badge === 'Đang Hot' || p.badge === 'Mới ra mắt')
          );

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
            };
          }

          if (p.reviewsCount && p.reviewsCount > 0 && p.rating && p.rating > 0) {
            return {
              ...p,
              isGuestFavorite,
              isTrending,
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
          };
        });

        // Đọc danh sách ID yêu thích từ localStorage
        const storedIdsRaw = localStorage.getItem(WISHLIST_STORAGE_KEY);
        let savedIds: number[] = [];

        if (storedIdsRaw) {
          try {
            savedIds = JSON.parse(storedIdsRaw);
          } catch {
            savedIds = [];
          }
        }

        // Nếu người dùng chưa từng lưu phòng nào, cung cấp 3 phòng mẫu nổi bật để kiểm tra UI Grid ban đầu
        if (!storedIdsRaw && mappedProps.length > 0) {
          const demoIds = mappedProps.slice(0, 3).map(p => p.id);
          savedIds = demoIds;
          localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(demoIds));
        }

        const filtered = mappedProps.filter(p => savedIds.includes(p.id));
        setWishlistProperties(filtered);
      })
      .catch(err => {
        console.error('Lỗi khi tải danh sách yêu thích:', err);
        const localProps = store ? store.getData().properties : [];
        setWishlistProperties(localProps.slice(0, 2));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [store]);

  // Xóa toàn bộ danh sách để kiểm tra Empty State
  const handleClearAll = () => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify([]));
    setWishlistProperties([]);
  };

  return (
    <div style={{ maxWidth: 1760, margin: '1.5rem auto 5rem', padding: '0 2.5rem' }}>
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Đường dẫn trang"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontSize: '0.85rem',
          color: 'var(--color-text-secondary, #475569)',
          marginBottom: '1.75rem',
        }}
      >
        <Link
          to="/"
          style={{
            color: 'inherit',
            textDecoration: 'none',
            fontWeight: 500,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary, #FF385C)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'inherit')}
        >
          Trang chủ
        </Link>
        <ChevronRight style={{ fontSize: '0.75rem', opacity: 0.7 }} />
        <span style={{ fontWeight: 600, color: 'var(--color-text-primary, #0F172A)' }}>
          Danh sách yêu thích
        </span>
      </nav>

      {/* Loading Skeleton / Spinner */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
          <div className="spinner-border text-danger" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary, #475569)', fontSize: '0.95rem' }}>
            Đang tải danh sách chỗ ở yêu thích của bạn...
          </p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TRẠNG THÁI TRỐNG (EMPTY STATE)
          ───────────────────────────────────────────────────────────────── */}
      {!isLoading && wishlistProperties.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '5rem 1.5rem',
            maxWidth: 540,
            margin: '2rem auto',
            background: 'var(--color-bg-surface, #FFFFFF)',
            borderRadius: '24px',
            border: '1px solid var(--color-border-subtle, #E2E8F0)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Icon Trái tim lớn tone xám nhạt */}
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              backgroundColor: 'var(--color-bg-muted, #F1F5F9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
            }}
          >
            <Heart style={{ fontSize: '3.2rem', color: '#94A3B8' }} />
          </div>

          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-text-primary, #0F172A)',
              marginBottom: '0.65rem',
              letterSpacing: '-0.02em',
            }}
          >
            Bạn chưa lưu mục nào
          </h2>

          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--color-text-secondary, #475569)',
              lineHeight: 1.6,
              marginBottom: '2rem',
            }}
          >
            Khi bạn tìm thấy chỗ nghỉ ưng ý, hãy nhấn vào biểu tượng trái tim để lưu lại và xem lại tại đây bất cứ lúc nào.
          </p>

          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.85rem 2rem',
              borderRadius: '9999px',
              background: 'var(--gradient-primary, linear-gradient(135deg, #FF385C 0%, #E00B41 100%))',
              color: '#FFFFFF',
              fontSize: '0.95rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(255, 56, 92, 0.35)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 56, 92, 0.45)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(255, 56, 92, 0.35)';
            }}
          >
            <Compass style={{ fontSize: '1.15rem' }} />
            <span>Khám phá ngay</span>
          </Link>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          DANH SÁCH CÓ DỮ LIỆU (GRID VIEW)
          ───────────────────────────────────────────────────────────────── */}
      {!isLoading && wishlistProperties.length > 0 && (
        <div>
          {/* Header Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '2rem',
              paddingBottom: '1.25rem',
              borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  color: 'var(--color-text-primary, #0F172A)',
                  margin: 0,
                  letterSpacing: '-0.025em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                }}
              >
                <span>Danh sách yêu thích</span>
                <HeartFill style={{ color: 'var(--color-primary, #FF385C)', fontSize: '1.35rem' }} />
              </h1>
              <p
                style={{
                  fontSize: '0.92rem',
                  color: 'var(--color-text-secondary, #475569)',
                  margin: '0.4rem 0 0',
                }}
              >
                Đang lưu {wishlistProperties.length} chỗ ở tuyệt vời cho kỳ nghỉ của bạn
              </p>
            </div>

            {/* Nút xóa tất cả để test Empty State */}
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'transparent',
                border: '1px solid var(--color-border-strong, #CBD5E1)',
                borderRadius: '9999px',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-text-secondary, #475569)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#DC2626';
                e.currentTarget.style.borderColor = '#FCA5A5';
                e.currentTarget.style.background = '#FEF2F2';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--color-text-secondary, #475569)';
                e.currentTarget.style.borderColor = 'var(--color-border-strong, #CBD5E1)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Trash style={{ fontSize: '0.85rem' }} />
              <span>Xóa tất cả</span>
            </button>
          </div>

          {/* Grid hiển thị các phòng */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '2.5rem 1.25rem',
            }}
          >
            {wishlistProperties.map(property => (
              <PropertyCard key={property.id} property={property} nights={2} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

