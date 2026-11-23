import React from 'react';

export interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  minHeight?: string | number;
  fullPage?: boolean;
  style?: React.CSSProperties;
}

export function LoadingSpinner({
  message,
  size = 44,
  minHeight = '50vh',
  fullPage = false,
  style,
}: LoadingSpinnerProps) {
  return (
    <div
      style={{
        minHeight: fullPage ? '100vh' : minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem 1rem',
        background: fullPage ? 'var(--color-bg-app)' : 'transparent',
        ...style,
      }}
      role="status"
      aria-label={message || 'Đang tải...'}
    >
      <div
        style={{
          width: size,
          height: size,
          border: '4px solid var(--color-border-subtle)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
        }}
        className="animate-spin"
      />
      {message && (
        <p
          style={{
            margin: 0,
            color: 'var(--color-text-secondary)',
            fontSize: '0.95rem',
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export default LoadingSpinner;
