// Shared Reusable UI Components: Exact Airbnb Vietnam Design (TypeScript)
import React, { useState, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Property } from '../data';
import { useStore } from '../contexts/StoreContext';
import { StarFill, Fire } from 'react-bootstrap-icons';

// Helper to format currency exactly like Airbnb Vietnam: e.g. 1.300.000 ₫
export function formatAirbnbVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

// ── UCTag & StateBanner (Silenced) ─────────────────────────────────────────
export function UCTag(_props: { children?: ReactNode }) {
  return null;
}
export function StateBanner(_props: any) {
  return null;
}

// ── Breadcrumb ──────────────────────────────────────────────────────────
export interface BreadcrumbItem {
  label: string;
  to?: string;
}
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Đường dẫn trang" style={{ marginBottom: '1.25rem' }}>
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {items.map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            {item.to ? (
              <Link to={item.to} style={{ color: 'var(--color-text-primary)', textDecoration: 'underline' }}>
                {item.label}
              </Link>
            ) : (
              <span style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
            )}
            {i < items.length - 1 && <span style={{ color: 'var(--color-text-muted)' }}>›</span>}
          </span>
        ))}
      </p>
    </nav>
  );
}

// ── Alert ──────────────────────────────────────────────────────────────
export function Alert({ type = 'info', title, children }: { type?: 'info' | 'ok' | 'warn' | 'error'; title?: string; children: ReactNode }) {
  const alertStyles: Record<string, { bg: string; border: string; color: string }> = {
    info: { bg: 'var(--color-info-bg)', border: 'var(--color-info-border)', color: 'var(--color-info)' },
    ok: { bg: 'var(--color-success-bg)', border: 'var(--color-success-border)', color: 'var(--color-success)' },
    warn: { bg: 'var(--color-warning-bg)', border: 'var(--color-warning-border)', color: 'var(--color-warning)' },
    error: { bg: 'var(--color-danger-bg)', border: 'var(--color-danger-border)', color: 'var(--color-danger)' },
  };

  const currentStyle = alertStyles[type] || alertStyles.info;

  return (
    <div
      style={{
        background: currentStyle.bg,
        border: `1px solid ${currentStyle.border}`,
        color: currentStyle.color,
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        margin: '1rem 0',
      }}
      role="alert"
    >
      {title && <strong style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.95rem' }}>{title}</strong>}
      <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

// ── Badge (Delegated to standard Badge component) ───────────────────────
export { Badge } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge';

// ── Property Card (Exact Airbnb Vietnam Card) ──────────────────────────────
export interface PropertyCardProps {
  property: Property;
  checkIn?: string;
  checkOut?: string;
  guests?: number | string;
  nights?: number;
  isHotSection?: boolean;
}

export function PropertyCard({ property, checkIn, checkOut, guests, nights = 2, isHotSection }: PropertyCardProps) {
  const navigate = useNavigate();
  const { store } = useStore();

  // Đọc trạng thái yêu thích từ localStorage để đồng bộ với Wishlist
  const [isFavorite, setIsFavorite] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('odd_wishlist_ids');
      if (stored) {
        const ids: number[] = JSON.parse(stored);
        return ids.includes(property.id);
      }
    } catch {}
    return false;
  });

  // Điểm rating thực tế trực tiếp từ API Backend (ưu tiên averageRating, sau đó là rating)
  // Xóa bỏ hoàn toàn giá trị fix cứng 5.0; nếu không có đánh giá -> calculatedRating = null
  let calculatedRating: number | null = null;
  const rawRating = property.averageRating ?? property.rating;
  const rawReviewsCount = property.reviewsCount ?? property.reviewCount;

  if (rawRating !== null && rawRating !== undefined && Number(rawRating) > 0 && (rawReviewsCount === undefined || rawReviewsCount > 0)) {
    calculatedRating = Math.round(Number(rawRating) * 10) / 10;
  } else if (rawRating === null || rawRating === 0 || rawReviewsCount === 0) {
    calculatedRating = null;
  } else {
    const propertyReviews = store ? store.getReviewsByProperty(property.id) : [];
    if (propertyReviews.length > 0) {
      const sum = propertyReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
      calculatedRating = Math.round((sum / propertyReviews.length) * 10) / 10;
    } else {
      calculatedRating = null;
    }
  }

  const hasRating = calculatedRating !== null && Number(calculatedRating) > 0;

  // ── ƯU TIÊN CAO NHẤT: Xác định cờ "Đang Hot" ở góc trên bên trái ──
  // BẮT BUỘC hiển thị badge "Đang Hot" nếu:
  // - property.isHot === true HOẶC
  // - property.isTrending === true HOẶC
  // - isHotSection === true (được render trong section xu hướng) HOẶC
  // - property.badge === 'Đang Hot' HOẶC 'Yêu thích nhất'
  const isHot = Boolean(
    isHotSection === true ||
    property.isHot === true ||
    property.isTrending === true ||
    property.badge === 'Đang Hot' ||
    property.badge === 'Yêu thích nhất'
  );

  const params = new URLSearchParams();
  if (checkIn) params.set('in', checkIn);
  if (checkOut) params.set('out', checkOut);
  if (guests) params.set('guests', String(guests));
  const detailUrl = `/property/${property.id}${params.toString() ? '?' + params.toString() : ''}`;

  // Toggle lưu vào danh sách yêu thích và cập nhật localStorage
  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !isFavorite;
    setIsFavorite(nextState);

    try {
      const stored = localStorage.getItem('odd_wishlist_ids');
      let ids: number[] = stored ? JSON.parse(stored) : [];
      if (nextState) {
        if (!ids.includes(property.id)) ids.push(property.id);
      } else {
        ids = ids.filter(id => id !== property.id);
      }
      localStorage.setItem('odd_wishlist_ids', JSON.stringify(ids));
    } catch (err) {
      console.error('Lỗi khi cập nhật danh sách yêu thích:', err);
    }
  };

  // 2 nights price calculation for Airbnb Vietnam display
  const totalPriceForStay = property.priceMin * nights;

  // Format title like Airbnb: "Phòng tại Thành phố Hồ Chí Minh" / "Nhà tại Quận Tây Hồ, Hà Nội"
  const formattedTitle = `${property.type} tại ${property.area || property.city}`;

  return (
    <article
      onClick={() => navigate(detailUrl)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        textDecoration: 'none',
        color: 'inherit',
        position: 'relative',
        width: '100%',
      }}
    >
      {/* Photo Wrapper */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '20 / 19',
          borderRadius: '14px',
          overflow: 'hidden',
          background: 'var(--color-bg-muted)',
          marginBottom: '0.65rem',
        }}
      >
        <img
          src={property.image}
          alt={property.name}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        />

        {/* 1. Góc trên bên trái: ƯU TIÊN CAO NHẤT cho badge "Đang Hot" HOẶC "Mới" */}
        {isHot ? (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              backgroundColor: '#FEE2E2',
              backdropFilter: 'blur(4px)',
              color: '#991B1B',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              zIndex: 2,
            }}
          >
            <Fire style={{ color: '#DC2626', fontSize: '0.85rem' }} />
            <span>Đang Hot</span>
          </div>
        ) : !hasRating ? (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(4px)',
              color: '#222222',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              zIndex: 2,
            }}
          >
            <span>Mới</span>
          </div>
        ) : null}

        {/* 2. Nút Trái tim (Wishlist Button) ở góc trên bên phải */}
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={isFavorite ? 'Bỏ lưu' : 'Lưu'}
          title={isFavorite ? 'Đã lưu' : 'Lưu'}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.45))',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <svg
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            role="presentation"
            focusable="false"
            style={{
              display: 'block',
              height: 25,
              width: 25,
              // Khi chưa lưu: nền trong suốt/mờ nhẹ, viền trắng
              // Khi đã lưu: màu hồng/đỏ có viền trắng dày nổi bật
              fill: isFavorite ? '#FF385C' : 'rgba(0, 0, 0, 0.3)',
              stroke: '#FFFFFF',
              strokeWidth: isFavorite ? 2.5 : 2,
              overflow: 'visible',
            }}
          >
            <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z" />
          </svg>
        </button>
      </div>

      {/* Info below image */}
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: '0.94rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={property.name}
        >
          {formattedTitle}
        </h3>

        {/* 3. Khu vực Đánh giá: Có điểm -> Icon sao vàng tươi #FFD700 + điểm số. Không có điểm -> TUYỆT ĐỐI KHÔNG hiện sao hay chữ "Mới", mà hiện text "Chưa đánh giá" màu xám nhạt (text-gray-500) */}
        <p
          style={{
            margin: '0.2rem 0 0',
            fontSize: '0.88rem',
            color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span style={{ fontWeight: 600 }}>{formatAirbnbVND(totalPriceForStay)}</span> cho {nights} đêm ·{' '}
          {hasRating ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
              <StarFill style={{ color: '#FFD700', fontSize: '0.78rem' }} />
              <span>{Number(calculatedRating).toFixed(1).replace('.', ',')}</span>
            </span>
          ) : (
            <span className="text-gray-500" style={{ color: '#6B7280', fontSize: '0.84rem', fontWeight: 500 }}>
              Chưa đánh giá
            </span>
          )}
        </p>
      </div>
    </article>
  );
}
