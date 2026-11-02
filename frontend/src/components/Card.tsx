// Standardized Container Card / Panel Component (TypeScript)
import React, { ReactNode } from 'react';

export interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  headerRight?: ReactNode;
  footer?: ReactNode;
  variant?: 'default' | 'elevated' | 'flat' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  borderAccent?: string; // e.g. '#FF385C', '#059669' for KPI cards
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  onClick?: () => void;
}

export function Card({
  title,
  subtitle,
  headerRight,
  footer,
  variant = 'default',
  padding = 'md',
  borderAccent,
  className = '',
  style = {},
  children,
  onClick,
}: CardProps) {
  const paddingMap = {
    none: '0',
    sm: '0.85rem 1rem',
    md: '1.25rem 1.5rem',
    lg: '1.75rem 2rem',
  };

  const shadowMap = {
    default: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.04)',
    elevated: '0 8px 28px rgba(0, 0, 0, 0.12)',
    flat: 'none',
    outline: 'none',
  };

  const borderMap = {
    default: '1px solid #EBEBEB',
    elevated: '1px solid #DDDDDD',
    flat: 'none',
    outline: '1px solid #DDDDDD',
  };

  return (
    <div
      onClick={onClick}
      className={`panel ${className}`}
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: borderMap[variant],
        borderLeft: borderAccent ? `4px solid ${borderAccent}` : undefined,
        boxShadow: shadowMap[variant],
        overflow: 'hidden',
        transition: onClick ? 'transform 0.2s ease, box-shadow 0.2s ease' : undefined,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {(title || subtitle || headerRight) && (
        <div
          style={{
            padding: paddingMap[padding],
            borderBottom: '1px solid #EBEBEB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            {title && (
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#222222', letterSpacing: '-0.01em' }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.88rem', color: '#717171' }}>
                {subtitle}
              </p>
            )}
          </div>
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}

      <div style={{ padding: paddingMap[padding] }}>{children}</div>

      {footer && (
        <div
          style={{
            padding: paddingMap[padding],
            borderTop: '1px solid #EBEBEB',
            background: '#F9FAFB',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

export default Card;
