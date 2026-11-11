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
  // Unified Semantic Token Presets (SPEC-FE-001)
  const variantStyles: Record<string, { bg: string; color: string; border?: string; dotColor?: string }> = {
    brand: {
      bg: 'var(--color-primary-soft)',
      color: 'var(--color-primary)',
      border: 'var(--color-primary-border)',
      dotColor: 'var(--color-primary)',
    },
    success: {
      bg: 'var(--color-success-bg)',
      color: 'var(--color-success)',
      border: 'var(--color-success-border)',
      dotColor: 'var(--color-success)',
    },
    ok: {
      bg: 'var(--color-success-bg)',
      color: 'var(--color-success)',
      border: 'var(--color-success-border)',
      dotColor: 'var(--color-success)',
    },
    active: {
      bg: 'var(--color-success-bg)',
      color: 'var(--color-success)',
      border: 'var(--color-success-border)',
      dotColor: 'var(--color-success)',
    },
    confirmed: {
      bg: 'var(--color-success-bg)',
      color: 'var(--color-success)',
      border: 'var(--color-success-border)',
      dotColor: 'var(--color-success)',
    },
    completed: {
      bg: 'var(--color-success-bg)',
      color: 'var(--color-success)',
      border: 'var(--color-success-border)',
      dotColor: 'var(--color-success)',
    },
    warning: {
      bg: 'var(--color-warning-bg)',
      color: 'var(--color-warning)',
      border: 'var(--color-warning-border)',
      dotColor: 'var(--color-warning)',
    },
    warn: {
      bg: 'var(--color-warning-bg)',
      color: 'var(--color-warning)',
      border: 'var(--color-warning-border)',
      dotColor: 'var(--color-warning)',
    },
    pending: {
      bg: 'var(--color-warning-bg)',
      color: 'var(--color-warning)',
      border: 'var(--color-warning-border)',
      dotColor: 'var(--color-warning)',
    },
    danger: {
      bg: 'var(--color-danger-bg)',
      color: 'var(--color-danger)',
      border: 'var(--color-danger-border)',
      dotColor: 'var(--color-danger)',
    },
    error: {
      bg: 'var(--color-danger-bg)',
      color: 'var(--color-danger)',
      border: 'var(--color-danger-border)',
      dotColor: 'var(--color-danger)',
    },
    cancelled: {
      bg: 'var(--color-danger-bg)',
      color: 'var(--color-danger)',
      border: 'var(--color-danger-border)',
      dotColor: 'var(--color-danger)',
    },
    locked: {
      bg: 'var(--color-danger-bg)',
      color: 'var(--color-danger)',
      border: 'var(--color-danger-border)',
      dotColor: 'var(--color-danger)',
    },
    info: {
      bg: 'var(--color-info-bg)',
      color: 'var(--color-info)',
      border: 'var(--color-info-border)',
      dotColor: 'var(--color-info)',
    },
    checked_in: {
      bg: 'var(--color-info-bg)',
      color: 'var(--color-info)',
      border: 'var(--color-info-border)',
      dotColor: 'var(--color-info)',
    },
    neutral: {
      bg: 'var(--color-bg-muted)',
      color: 'var(--color-text-secondary)',
      border: 'var(--color-border-subtle)',
      dotColor: 'var(--color-text-muted)',
    },
    outline: {
      bg: 'var(--color-bg-surface)',
      color: 'var(--color-text-primary)',
      border: 'var(--color-border-subtle)',
      dotColor: 'var(--color-text-primary)',
    },
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
