// Shared Reusable UI Components: Exact Airbnb Vietnam Design (TypeScript)
import React, { useState, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Property } from '../data';

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
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#717171', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {items.map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            {item.to ? (
              <Link to={item.to} style={{ color: '#222222', textDecoration: 'underline' }}>
                {item.label}
              </Link>
            ) : (
              <span style={{ color: '#717171' }}>{item.label}</span>
            )}
            {i < items.length - 1 && <span style={{ color: '#B0B0B0' }}>›</span>}
          </span>
        ))}
      </p>
    </nav>
  );
}

// ── Alert ──────────────────────────────────────────────────────────────
export function Alert({ type = 'info', title, children }: { type?: 'info' | 'ok' | 'warn' | 'error'; title?: string; children: ReactNode }) {
  const alertStyles: Record<string, { bg: string; border: string; color: string }> = {
    info: { bg: '#f0f9ff', border: '#bae6fd', color: '#0369a1' },
    ok: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
    warn: { bg: '#fffbeb', border: '#fde68a', color: '#b45309' },
    error: { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c' },
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
}

export function PropertyCard({ property, checkIn, checkOut, guests, nights = 2 }: PropertyCardProps) {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  const params = new URLSearchParams();
  if (checkIn) params.set('in', checkIn);
  if (checkOut) params.set('out', checkOut);
  if (guests) params.set('guests', String(guests));
  const detailUrl = `/property/${property.id}${params.toString() ? '?' + params.toString() : ''}`;

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  // 2 nights price calculation for Airbnb Vietnam display
  const totalPriceForStay = property.priceMin * nights;
  const ratingText = property.rating ? property.rating.toFixed(1).replace('.', ',') : '5,0';

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
          background: '#f1f5f9',
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

        {/* Guest Favorite Pill Badge */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(4px)',
            color: '#222222',
            padding: '4px 10px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Được khách yêu thích
        </div>

        {/* Heart Favorite Button */}
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
            filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4))',
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
              height: 24,
              width: 24,
              fill: isFavorite ? '#FF385C' : 'rgba(0, 0, 0, 0.45)',
              stroke: '#ffffff',
              strokeWidth: 2,
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
            color: '#222222',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={property.name}
        >
          {formattedTitle}
        </h3>

        <p
          style={{
            margin: '0.2rem 0 0',
            fontSize: '0.88rem',
            color: '#222222',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <span style={{ fontWeight: 600 }}>{formatAirbnbVND(totalPriceForStay)}</span> cho {nights} đêm ·{' '}
          <span>★ {ratingText}</span>
        </p>
      </div>
    </article>
  );
}
