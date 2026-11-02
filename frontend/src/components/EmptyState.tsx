// Standard Empty State Component for lists, tables, and searches (TypeScript)
import React, { ReactNode } from 'react';
import { Inbox } from 'react-bootstrap-icons';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string | ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  compact?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  style,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`app-empty-state ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: compact ? '2rem 1.5rem' : '3.5rem 2rem',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px dashed #E2E8F0',
        margin: '1rem 0',
        ...style,
      }}
    >
      <div
        style={{
          width: compact ? 48 : 64,
          height: compact ? 48 : 64,
          borderRadius: '50%',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: compact ? '1.35rem' : '1.75rem',
          color: '#94A3B8',
          marginBottom: '1rem',
        }}
      >
        {icon || <Inbox />}
      </div>

      <h3
        style={{
          fontSize: compact ? '1rem' : '1.15rem',
          fontWeight: 700,
          color: '#1E293B',
          margin: '0 0 0.35rem',
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          style={{
            fontSize: compact ? '0.85rem' : '0.9rem',
            color: '#64748B',
            maxWidth: 420,
            margin: '0 0 1.25rem',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
