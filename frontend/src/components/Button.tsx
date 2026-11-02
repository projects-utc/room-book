// Reusable Standard Button Component (TypeScript)
import React, { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'secondary' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  block?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  icon,
  iconPosition = 'left',
  loading = false,
  disabled,
  className = '',
  style = {},
  children,
  ...props
}: ButtonProps) {
  // Base classes mapped from design system
  const variantClass = {
    primary: 'btn-primary',
    outline: 'btn-outline',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  }[variant] || 'btn-primary';

  const sizeClass = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  }[size];

  const blockClass = block ? 'btn-block' : '';
  const combinedClass = `btn ${variantClass} ${sizeClass} ${blockClass} ${className}`.trim();

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={combinedClass}
      style={{
        display: block ? 'flex' : 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.45rem',
        ...style,
      }}
    >
      {loading ? (
        <span
          style={{
            width: 14,
            height: 14,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            display: 'inline-block',
          }}
        />
      ) : (
        icon && iconPosition === 'left' && <span style={{ display: 'inline-flex', flexShrink: 0 }}>{icon}</span>
      )}

      {children && <span>{children}</span>}

      {!loading && icon && iconPosition === 'right' && (
        <span style={{ display: 'inline-flex', flexShrink: 0 }}>{icon}</span>
      )}
    </button>
  );
}

export default Button;
