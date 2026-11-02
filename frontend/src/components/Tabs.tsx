// Standardized Tabs Navigation Component (TypeScript)
import React, { ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pills';
  className?: string;
  style?: React.CSSProperties;
}

export function Tabs({
  items,
  activeId,
  onChange,
  variant = 'underline',
  className = '',
  style = {},
}: TabsProps) {
  if (variant === 'pills') {
    return (
      <div
        className={`tabs-pills ${className}`}
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          ...style,
        }}
      >
        {items.map(tab => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: isActive ? '1px solid #222222' : '1px solid #DDDDDD',
                background: isActive ? '#222222' : '#ffffff',
                color: isActive ? '#ffffff' : '#222222',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                    color: isActive ? '#ffffff' : '#717171',
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    marginLeft: '0.2rem',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Underline variant (Default)
  return (
    <div
      className={`tabs-underline no-scrollbar ${className}`}
      style={{
        display: 'flex',
        gap: '1.25rem',
        borderBottom: '1px solid #EBEBEB',
        overflowX: 'auto',
        marginBottom: '1.5rem',
        ...style,
      }}
    >
      {items.map(tab => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: isActive ? '2px solid #222222' : '2px solid transparent',
              color: isActive ? '#222222' : '#717171',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.92rem',
              padding: '0.65rem 0.25rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s ease, border-color 0.15s ease',
            }}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                style={{
                  fontSize: '0.75rem',
                  background: isActive ? '#222222' : '#F1F5F9',
                  color: isActive ? '#ffffff' : '#717171',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  fontWeight: 700,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
