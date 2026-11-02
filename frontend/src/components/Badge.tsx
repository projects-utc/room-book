// Standard Badge Component with Rich Semantic Variants & Styles (TypeScript)
import React, { ReactNode } from 'react';

export type BadgeVariant =
  | 'brand'
  | 'success'
  | 'ok'
  | 'warning'
  | 'warn'
  | 'danger'
  | 'error'
  | 'info'
  | 'neutral'
  | 'outline'
  | 'active'
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'locked';

export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant | string;
  size?: BadgeSize;
  dot?: boolean;
  pill?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export function Badge({
  variant = 'brand',
  size = 'sm',
  dot = false,
  pill = true,
  icon,
  children,
  style,
  className = '',
}: BadgeProps) {
  // Color presets matching modern Airbnb & ODauDay Stay palette
  const variantStyles: Record<string, { bg: string; color: string; border?: string; dotColor?: string }> = {
    brand: { bg: '#FFF1F2', color: '#E11D48', border: '#FFE4E6', dotColor: '#E11D48' },
    success: { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', dotColor: '#10B981' },
    ok: { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', dotColor: '#10B981' },
    active: { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', dotColor: '#10B981' },
    confirmed: { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', dotColor: '#10B981' },
    completed: { bg: '#F1F5F9', color: '#334155', border: '#CBD5E1', dotColor: '#64748B' },
    warning: { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A', dotColor: '#F59E0B' },
    warn: { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A', dotColor: '#F59E0B' },
    pending: { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A', dotColor: '#F59E0B' },
    danger: { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', dotColor: '#EF4444' },
    error: { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', dotColor: '#EF4444' },
    cancelled: { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', dotColor: '#EF4444' },
    locked: { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', dotColor: '#EF4444' },
    info: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', dotColor: '#3B82F6' },
    checked_in: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', dotColor: '#3B82F6' },
    neutral: { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB', dotColor: '#9CA3AF' },
    outline: { bg: '#FFFFFF', color: '#222222', border: '#DDDDDD', dotColor: '#222222' },
  };

  const currentTheme = variantStyles[variant.toLowerCase()] || variantStyles.neutral;

  const sizeStyles: Record<BadgeSize, { padding: string; fontSize: string; dotSize: number }> = {
    xs: { padding: '2px 6px', fontSize: '0.7rem', dotSize: 5 },
    sm: { padding: '3px 8px', fontSize: '0.78rem', dotSize: 6 },
    md: { padding: '4px 12px', fontSize: '0.85rem', dotSize: 8 },
  };

  const currentSize = sizeStyles[size] || sizeStyles.sm;

  return (
    <span
      className={`app-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        background: currentTheme.bg,
        color: currentTheme.color,
        border: `1px solid ${currentTheme.border || currentTheme.bg}`,
        borderRadius: pill ? '9999px' : '6px',
        padding: currentSize.padding,
        fontSize: currentSize.fontSize,
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: '0.01em',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: currentSize.dotSize,
            height: currentSize.dotSize,
            borderRadius: '50%',
            background: currentTheme.dotColor || currentTheme.color,
            flexShrink: 0,
          }}
        />
      )}
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
