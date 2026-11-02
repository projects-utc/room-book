// Standardized Form Field Components: InputField, SelectField, TextAreaField (TypeScript)
import React, { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

// ── Base Field Wrapper ──────────────────────────────────────────────────────
export interface BaseFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function FieldWrapper({
  label,
  required,
  error,
  helperText,
  className = '',
  style = {},
  children,
}: BaseFieldProps & { children: ReactNode }) {
  return (
    <div className={`field ${className}`} style={{ marginBottom: '1.25rem', ...style }}>
      {label && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: '#222222', marginBottom: '0.35rem' }}>
          <span>{label}</span>
          {required && <span style={{ color: '#FF385C' }}>*</span>}
        </label>
      )}

      {children}

      {error ? (
        <span style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '0.25rem', display: 'block' }}>
          {error}
        </span>
      ) : helperText ? (
        <span style={{ fontSize: '0.78rem', color: '#717171', marginTop: '0.25rem', display: 'block' }}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
}

// ── InputField Component ────────────────────────────────────────────────────
export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement>, BaseFieldProps {}

export function InputField({
  label,
  required,
  error,
  helperText,
  icon,
  className = '',
  style = {},
  id,
  ...props
}: InputFieldProps) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);

  return (
    <FieldWrapper label={label} required={required} error={error} helperText={helperText} className={className} style={style}>
      <div style={{ position: 'relative', width: '100%' }}>
        {icon && (
          <div
            style={{
              position: 'absolute',
              left: '0.9rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#717171',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {icon}
          </div>
        )}
        <input
          {...props}
          id={inputId}
          required={required}
          className="form-control"
          style={{
            paddingLeft: icon ? '2.4rem' : '1rem',
            borderColor: error ? '#dc2626' : undefined,
          }}
        />
      </div>
    </FieldWrapper>
  );
}

// ── SelectField Component ───────────────────────────────────────────────────
export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement>, BaseFieldProps {
  options: SelectOption[];
}

export function SelectField({
  label,
  required,
  error,
  helperText,
  icon,
  options = [],
  className = '',
  style = {},
  id,
  children,
  ...props
}: SelectFieldProps) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);

  return (
    <FieldWrapper label={label} required={required} error={error} helperText={helperText} className={className} style={style}>
      <div style={{ position: 'relative', width: '100%' }}>
        {icon && (
          <div
            style={{
              position: 'absolute',
              left: '0.9rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#717171',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {icon}
          </div>
        )}
        <select
          {...props}
          id={selectId}
          required={required}
          className="form-control"
          style={{
            paddingLeft: icon ? '2.4rem' : '1rem',
            borderColor: error ? '#dc2626' : undefined,
            cursor: 'pointer',
          }}
        >
          {options.length > 0
            ? options.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
      </div>
    </FieldWrapper>
  );
}

// ── TextAreaField Component ─────────────────────────────────────────────────
export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, BaseFieldProps {}

export function TextAreaField({
  label,
  required,
  error,
  helperText,
  className = '',
  style = {},
  id,
  rows = 3,
  ...props
}: TextAreaFieldProps) {
  const areaId = id || (label ? `area-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);

  return (
    <FieldWrapper label={label} required={required} error={error} helperText={helperText} className={className} style={style}>
      <textarea
        {...props}
        id={areaId}
        rows={rows}
        required={required}
        className="form-control"
        style={{
          borderColor: error ? '#dc2626' : undefined,
          resize: 'vertical',
          lineHeight: 1.6,
        }}
      />
    </FieldWrapper>
  );
}
