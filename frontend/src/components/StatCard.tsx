// Standardized Stat / KPI Metric Card Component (TypeScript)
import React, { ReactNode } from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: 'brand' | 'ok' | 'warn' | 'info' | 'danger';
  icon?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  sublabel,
  accent = 'brand',
  icon,
  className = '',
  style = {},
  onClick,
}: StatCardProps) {
  const accentColors = {
    brand: '#FF385C',
    ok: '#008A05',
    warn: '#C28E00',
    info: '#0284C7',
    danger: '#C13515',
  };

  const currentColor = accentColors[accent] || accentColors.brand;

  return (
    <div
      onClick={onClick}
      className={`panel ${className}`}
      style={{
        background: '#ffffff',
        border: '1px solid #EBEBEB',
        borderLeft: `4px solid ${currentColor}`,
        borderRadius: '14px',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        ...style,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span
          style={{
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: '#717171',
            display: 'block',
          }}
        >
          {label}
        </span>
        {icon && <span style={{ color: currentColor, fontSize: '1.25rem' }}>{icon}</span>}
      </div>

      <p
        style={{
          fontSize: '1.85rem',
          fontWeight: 800,
          color: accent === 'brand' ? '#222222' : currentColor,
          margin: '0.35rem 0 0',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </p>

      {sublabel && (
        <span style={{ fontSize: '0.82rem', color: '#717171', marginTop: '0.25rem', display: 'block' }}>
          {sublabel}
        </span>
      )}
    </div>
  );
}

export default StatCard;
