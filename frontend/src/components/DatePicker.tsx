// Standard DatePicker & DateRangePicker Component (Airbnb Design System)
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  CalendarEvent,
  Calendar3,
  ChevronLeft,
  ChevronRight,
  XCircleFill,
  ClockHistory,
} from 'react-bootstrap-icons';

// ── Date Formatting & Helper Utilities ─────────────────────────────────────────

export function formatDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(isoStr?: string): Date | null {
  if (!isoStr) return null;
  const parts = isoStr.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m, d);
}

export function formatDisplayDateVN(isoStr?: string): string {
  if (!isoStr) return '';
  const d = parseISODate(isoStr);
  if (!d) return isoStr;
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}/${year}`;
}

export function formatFriendlyDateVN(isoStr?: string): string {
  if (!isoStr) return '';
  const d = parseISODate(isoStr);
  if (!d) return isoStr;
  return `${d.getDate()} thg ${d.getMonth() + 1}, ${d.getFullYear()}`;
}

const WEEKDAY_NAMES_VN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_NAMES_VN = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

// ── Shared Hooks & Types ───────────────────────────────────────────────────────

export interface DatePickerProps {
  label?: string;
  value?: string; // YYYY-MM-DD
  onChange?: (date: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  disabledDates?: string[];
  isDateDisabled?: (dateStr: string) => boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  inline?: boolean;
  quickSelect?: boolean;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface DateRangePickerProps {
  label?: string;
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  minDate?: string;
  maxDate?: string;
  disabledDates?: string[];
  isDateDisabled?: (dateStr: string) => boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  inline?: boolean;
  quickSelect?: boolean;
  variant?: 'default' | 'search-hero' | 'search-compact';
  align?: 'left' | 'center' | 'right';
  id?: string;
  className?: string;
  style?: React.CSSProperties;
}

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handler();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ref, handler, enabled]);
}

function useMonthNav(initialIsoDate?: string) {
  const initial = parseISODate(initialIsoDate) || new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    if (initialIsoDate) {
      const parsed = parseISODate(initialIsoDate);
      if (parsed) {
        setViewYear(parsed.getFullYear());
        setViewMonth(parsed.getMonth());
      }
    }
  }, [initialIsoDate]);

  const prevMonth = () => {
    setViewMonth(prev => {
      if (prev === 0) {
        setViewYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const nextMonth = () => {
    setViewMonth(prev => {
      if (prev === 11) {
        setViewYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const setView = (year: number, month: number) => {
    setViewYear(year);
    setViewMonth(month);
  };

  return { viewYear, viewMonth, prevMonth, nextMonth, setView };
}

// ── Common Reusable Subcomponents ──────────────────────────────────────────────

function MonthHeader({
  viewYear,
  viewMonth,
  onPrev,
  onNext,
}: {
  viewYear: number;
  viewMonth: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const navBtnStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderRadius: '50%',
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--color-text-primary)',
    transition: 'background 0.15s ease',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.85rem',
      }}
    >
      <button
        type="button"
        onClick={onPrev}
        aria-label="Tháng trước"
        style={navBtnStyle}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-muted)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <ChevronLeft style={{ fontSize: '0.85rem' }} />
      </button>

      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
        {MONTH_NAMES_VN[viewMonth]} năm {viewYear}
      </span>

      <button
        type="button"
        onClick={onNext}
        aria-label="Tháng sau"
        style={navBtnStyle}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-muted)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <ChevronRight style={{ fontSize: '0.85rem' }} />
      </button>
    </div>
  );
}

interface QuickPresetsProps {
  items: { label: string; onClick: () => void }[];
}

function QuickPresets({ items }: QuickPresetsProps) {
  return (
    <div
      style={{
        marginTop: '0.65rem',
        paddingTop: '0.65rem',
        borderTop: '1px solid var(--color-bg-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.2rem',
        }}
      >
        <ClockHistory /> Chọn nhanh:
      </span>
      {items.map(item => (
        <button
          key={item.label}
          type="button"
          onClick={item.onClick}
          style={{
            background: 'var(--color-bg-app)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ── Core Calendar Grid Component ───────────────────────────────────────────────

interface CalendarGridProps {
  viewYear: number;
  viewMonth: number;
  mode: 'single' | 'range';
  selectedDate?: string;
  startDate?: string;
  endDate?: string;
  hoverDate?: string;
  minDate?: string;
  maxDate?: string;
  disabledDates?: string[];
  isDateDisabled?: (dateStr: string) => boolean;
  onDateClick: (isoDate: string) => void;
  onDateHover?: (isoDate: string | null) => void;
}

function CalendarGrid({
  viewYear,
  viewMonth,
  mode,
  selectedDate,
  startDate,
  endDate,
  hoverDate,
  minDate,
  maxDate,
  disabledDates = [],
  isDateDisabled,
  onDateClick,
  onDateHover,
}: CalendarGridProps) {
  const todayISO = formatDateToISO(new Date());
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const startOffset = (firstDayWeekday + 6) % 7;
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const effectiveEnd = endDate || (startDate && hoverDate && hoverDate >= startDate ? hoverDate : undefined);

  const gridCells = useMemo(() => {
    const cells: { dateISO: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      cells.push({
        dateISO: formatDateToISO(new Date(viewYear, viewMonth - 1, d)),
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        dateISO: formatDateToISO(new Date(viewYear, viewMonth, d)),
        dayNumber: d,
        isCurrentMonth: true,
      });
    }

    const totalSlots = cells.length <= 35 ? 35 : 42;
    const remaining = totalSlots - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        dateISO: formatDateToISO(new Date(viewYear, viewMonth + 1, d)),
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [viewYear, viewMonth, startOffset, daysInMonth, daysInPrevMonth]);

  return (
    <div style={{ width: '100%' }}>
      {/* Weekday labels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          marginBottom: '0.4rem',
        }}
      >
        {WEEKDAY_NAMES_VN.map((day, idx) => (
          <span
            key={day}
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: idx >= 5 ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              padding: '2px 0',
            }}
          >
            {day}
          </span>
        ))}
      </div>

      {/* Day cells */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '2px' }}
        onMouseLeave={() => onDateHover && onDateHover(null)}
      >
        {gridCells.map(cell => {
          const { dateISO, dayNumber, isCurrentMonth } = cell;

          const isDisabled =
            !isCurrentMonth ||
            (minDate && dateISO < minDate) ||
            (maxDate && dateISO > maxDate) ||
            disabledDates.includes(dateISO) ||
            (isDateDisabled && isDateDisabled(dateISO));

          const isToday = dateISO === todayISO;

          let isSelected = false;
          let isRangeStart = false;
          let isRangeEnd = false;
          let isInRange = false;

          if (mode === 'single') {
            isSelected = dateISO === selectedDate;
          } else {
            isRangeStart = dateISO === startDate;
            isRangeEnd = dateISO === effectiveEnd;
            isSelected = isRangeStart || isRangeEnd;
            if (startDate && effectiveEnd && dateISO > startDate && dateISO < effectiveEnd) {
              isInRange = true;
            }
          }

          let bg = 'transparent';
          let textColor = isCurrentMonth ? 'var(--color-text-primary)' : 'var(--color-border-strong)';
          let fontWeight: number | string = 500;

          if (isDisabled) {
            textColor = 'var(--color-text-disabled)';
            bg = 'transparent';
          } else if (isSelected) {
            bg = 'var(--color-primary)';
            textColor = 'var(--color-bg-surface)';
            fontWeight = 700;
          } else if (isInRange) {
            bg = 'var(--color-primary-soft)';
            textColor = 'var(--color-primary)';
            fontWeight = 600;
          }

          return (
            <div
              key={dateISO}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                background: isInRange && !isDisabled ? 'var(--color-primary-soft)' : 'transparent',
                borderRadius: isRangeStart ? '50% 0 0 50%' : isRangeEnd ? '0 50% 50% 0' : undefined,
              }}
            >
              <button
                type="button"
                disabled={Boolean(isDisabled)}
                onClick={() => !isDisabled && onDateClick(dateISO)}
                onMouseEnter={() => !isDisabled && onDateHover && onDateHover(dateISO)}
                aria-label={dateISO}
                style={{
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: isToday && !isSelected ? '1px solid var(--color-primary)' : 'none',
                  borderRadius: '50%',
                  background: bg,
                  color: textColor,
                  fontSize: '0.86rem',
                  fontWeight,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.15s ease, transform 0.1s ease',
                  outline: 'none',
                  position: 'relative',
                  userSelect: 'none',
                  textDecoration: isDisabled ? 'line-through' : 'none',
                }}
                onMouseDown={e => !isDisabled && (e.currentTarget.style.transform = 'scale(0.92)')}
                onMouseUp={e => !isDisabled && (e.currentTarget.style.transform = 'scale(1)')}
              >
                {dayNumber}
                {isToday && !isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 3,
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: isDisabled ? 'var(--color-text-disabled)' : 'var(--color-primary)',
                    }}
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Dropdown / Inline Calendar Box ─────────────────────────────────────────────

function CalendarCard({
  children,
  inline,
  width = 320,
}: {
  children: React.ReactNode;
  inline?: boolean;
  width?: number | string;
}) {
  return (
    <div
      style={{
        background: 'var(--color-bg-surface)',
        borderRadius: 16,
        padding: '1.15rem',
        boxShadow: inline ? 'none' : 'var(--shadow-dropdown)',
        border: '1px solid var(--color-border-subtle)',
        width,
        zIndex: inline ? 1 : 1050,
      }}
    >
      {children}
    </div>
  );
}

// ── Single DatePicker Component ────────────────────────────────────────────────

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Chọn ngày (DD/MM/YYYY)',
  minDate = formatDateToISO(new Date()),
  maxDate,
  disabledDates = [],
  isDateDisabled,
  disabled = false,
  required = false,
  error,
  helperText,
  inline = false,
  quickSelect = true,
  id,
  className = '',
  style,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { viewYear, viewMonth, prevMonth, nextMonth, setView } = useMonthNav(value);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen && !inline);

  const handleDateSelect = (isoDate: string) => {
    onChange?.(isoDate);
    if (!inline) setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
  };

  const setQuickDate = (daysFromNow: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    const iso = formatDateToISO(target);
    onChange?.(iso);
    setView(target.getFullYear(), target.getMonth());
    if (!inline) setIsOpen(false);
  };

  const formattedDisplay = value ? formatDisplayDateVN(value) : '';

  const calendarBody = (
    <CalendarCard inline={inline} width={320}>
      <MonthHeader
        viewYear={viewYear}
        viewMonth={viewMonth}
        onPrev={prevMonth}
        onNext={nextMonth}
      />
      <CalendarGrid
        viewYear={viewYear}
        viewMonth={viewMonth}
        mode="single"
        selectedDate={value}
        minDate={minDate}
        maxDate={maxDate}
        disabledDates={disabledDates}
        isDateDisabled={isDateDisabled}
        onDateClick={handleDateSelect}
      />
      {quickSelect && (
        <QuickPresets
          items={[
            { label: 'Hôm nay', onClick: () => setQuickDate(0) },
            { label: 'Ngày mai', onClick: () => setQuickDate(1) },
            { label: '+1 Tuần', onClick: () => setQuickDate(7) },
          ]}
        />
      )}
    </CalendarCard>
  );

  if (inline) {
    return (
      <div className={`app-datepicker-inline ${className}`} style={style}>
        {label && (
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>
            {label} {required && <span style={{ color: 'var(--color-primary)' }}>*</span>}
          </label>
        )}
        {calendarBody}
        {error && <span style={{ display: 'block', marginTop: '0.35rem', color: 'var(--color-danger)', fontSize: '0.8rem' }}>{error}</span>}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`app-datepicker-wrapper ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
    >
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            marginBottom: '0.4rem',
            fontWeight: 600,
            fontSize: '0.88rem',
            color: 'var(--color-text-primary)',
          }}
        >
          {label} {required && <span style={{ color: 'var(--color-primary)' }}>*</span>}
        </label>
      )}

      {/* Input Display Pill */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={e => !disabled && e.key === 'Enter' && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: error ? '1.5px solid var(--color-danger)' : isOpen ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
          borderRadius: 12,
          padding: '0.65rem 0.95rem',
          background: disabled ? 'var(--color-bg-app)' : 'var(--color-bg-surface)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen ? '0 0 0 3px var(--color-primary-soft)' : 'none',
          transition: 'all 0.15s ease',
          opacity: disabled ? 0.7 : 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
          <CalendarEvent style={{ color: isOpen ? 'var(--color-primary)' : 'var(--color-text-muted)', fontSize: '1.05rem', flexShrink: 0 }} />
          <span
            style={{
              fontSize: '0.92rem',
              color: formattedDisplay ? 'var(--color-text-primary)' : 'var(--color-text-disabled)',
              fontWeight: formattedDisplay ? 600 : 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {formattedDisplay || placeholder}
          </span>
        </div>

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            title="Chọn lại ngày"
            aria-label="Chọn lại ngày"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--color-text-disabled)',
              display: 'flex',
              alignItems: 'center',
              marginLeft: '0.5rem',
            }}
          >
            <XCircleFill style={{ fontSize: '0.95rem' }} />
          </button>
        )}
      </div>

      {helperText && !error && (
        <span style={{ display: 'block', marginTop: '0.35rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
          {helperText}
        </span>
      )}
      {error && (
        <span style={{ display: 'block', marginTop: '0.35rem', color: 'var(--color-danger)', fontSize: '0.8rem', fontWeight: 500 }}>
          {error}
        </span>
      )}

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            zIndex: 1100,
            animation: 'fadeInSlide 0.15s ease-out',
          }}
        >
          {calendarBody}
        </div>
      )}
    </div>
  );
}

// ── Date Range Picker Component (Airbnb Range Picker) ─────────────────────────

export function DateRangePicker({
  label,
  value = { start: '', end: '' },
  onChange,
  minDate = formatDateToISO(new Date()),
  maxDate,
  disabledDates = [],
  isDateDisabled,
  disabled = false,
  required = false,
  error,
  helperText,
  inline = false,
  quickSelect = true,
  variant = 'default',
  align = 'left',
  id,
  className = '',
  style,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [internalStart, setInternalStart] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { viewYear, viewMonth, prevMonth, nextMonth, setView } = useMonthNav(value.start);

  useEffect(() => {
    if (!isOpen) {
      setInternalStart(null);
    }
  }, [isOpen]);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen && !inline);

  const handleDateSelect = (isoDate: string) => {
    const currentStart = internalStart;

    if (!currentStart) {
      // Nhấp lần 1: Chọn ngày bắt đầu, chờ ngày kết thúc
      setInternalStart(isoDate);
      onChange?.({ start: isoDate, end: '' });
    } else {
      // Nhấp lần 2: Chọn ngày kết thúc
      if (isoDate >= currentStart) {
        let hasConflictBetween = false;
        if (isDateDisabled || disabledDates?.length) {
          const cur = parseISODate(currentStart);
          const endD = parseISODate(isoDate);
          if (cur && endD) {
            while (cur < endD) {
              const curIso = formatDateToISO(cur);
              if (
                disabledDates?.includes(curIso) ||
                (isDateDisabled && isDateDisabled(curIso))
              ) {
                hasConflictBetween = true;
                break;
              }
              cur.setDate(cur.getDate() + 1);
            }
          }
        }
        if (hasConflictBetween) {
          setInternalStart(isoDate);
          onChange?.({ start: isoDate, end: '' });
          return;
        }

        const finalStart = currentStart;
        setInternalStart(null);
        onChange?.({ start: finalStart, end: isoDate });
        if (!inline) setIsOpen(false);
      } else {
        // Nhấp ngày trước start -> chọn lại ngày bắt đầu mới
        setInternalStart(isoDate);
        onChange?.({ start: isoDate, end: '' });
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalStart(null);
    onChange?.({ start: '', end: '' });
  };

  const setQuickRange = (nights: number) => {
    setInternalStart(null);
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + nights);
    const range = {
      start: formatDateToISO(start),
      end: formatDateToISO(end),
    };
    onChange?.(range);
    setView(start.getFullYear(), start.getMonth());
    if (!inline) setIsOpen(false);
  };

  const activeStart = internalStart || value.start;
  const activeEnd = internalStart ? '' : value.end;

  const startDisplay = activeStart ? formatDisplayDateVN(activeStart) : 'Nhận phòng';
  const endDisplay = activeEnd ? formatDisplayDateVN(activeEnd) : 'Trả phòng';

  let nightsCount = 0;
  if (activeStart && activeEnd) {
    const s = parseISODate(activeStart);
    const e = parseISODate(activeEnd);
    if (s && e) {
      nightsCount = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  const calendarBody = (
    <CalendarCard inline={inline} width={330}>
      <MonthHeader
        viewYear={viewYear}
        viewMonth={viewMonth}
        onPrev={prevMonth}
        onNext={nextMonth}
      />
      <CalendarGrid
        viewYear={viewYear}
        viewMonth={viewMonth}
        mode="range"
        startDate={activeStart}
        endDate={activeEnd}
        hoverDate={hoverDate || undefined}
        minDate={minDate}
        maxDate={maxDate}
        disabledDates={disabledDates}
        isDateDisabled={isDateDisabled}
        onDateClick={handleDateSelect}
        onDateHover={setHoverDate}
      />

      {/* Selected nights indicator & reset */}
      <div
        style={{
          marginTop: '0.75rem',
          paddingTop: '0.65rem',
          borderTop: '1px solid var(--color-bg-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
          {activeStart && activeEnd
            ? `Đã chọn: ${nightsCount} đêm`
            : activeStart
            ? 'Vui lòng chọn ngày kết thúc'
            : 'Vui lòng chọn ngày bắt đầu'}
        </span>

        {(activeStart || activeEnd) && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Chọn lại ngày
          </button>
        )}
      </div>

      {quickSelect && (
        <QuickPresets
          items={[
            { label: '2 đêm', onClick: () => setQuickRange(2) },
            { label: '3 đêm', onClick: () => setQuickRange(3) },
            { label: '1 tuần', onClick: () => setQuickRange(7) },
          ]}
        />
      )}
    </CalendarCard>
  );

  if (inline) {
    return (
      <div className={`app-daterangepicker-inline ${className}`} style={style}>
        {label && (
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>
            {label} {required && <span style={{ color: 'var(--color-primary)' }}>*</span>}
          </label>
        )}
        {calendarBody}
      </div>
    );
  }

  // Render variant triggers
  const renderTrigger = () => {
    if (variant === 'search-hero') {
      return (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={e => !disabled && e.key === 'Enter' && setIsOpen(!isOpen)}
          style={{ cursor: disabled ? 'not-allowed' : 'pointer', userSelect: 'none', padding: '2px 0' }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--color-text-primary)',
              letterSpacing: '0.02em',
              marginBottom: 2,
            }}
          >
            {label || 'Thời gian'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem' }}>
            {!activeStart && !activeEnd ? (
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>Chọn ngày</span>
            ) : activeStart && !activeEnd ? (
              <>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatDisplayDateVN(activeStart)}</span>
                <span style={{ color: 'var(--color-text-disabled)', fontSize: '0.8rem' }}>→</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>Chọn ngày trả phòng</span>
              </>
            ) : !activeStart && activeEnd ? (
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatDisplayDateVN(activeEnd)}</span>
            ) : (
              <>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatDisplayDateVN(activeStart)}</span>
                <span style={{ color: 'var(--color-text-disabled)', fontSize: '0.8rem' }}>→</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatDisplayDateVN(activeEnd)}</span>
                {nightsCount > 0 && (
                  <span
                    style={{
                      background: 'var(--color-primary-soft)',
                      color: 'var(--color-primary)',
                      padding: '1px 6px',
                      borderRadius: 9999,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      marginLeft: '0.2rem',
                    }}
                  >
                    {nightsCount} đêm
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      );
    }

    if (variant === 'search-compact') {
      return (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={e => !disabled && e.key === 'Enter' && setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '0.82rem',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            userSelect: 'none',
          }}
        >
          <Calendar3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', flexShrink: 0 }} />
          <span>
            {activeStart && activeEnd
              ? `${formatDisplayDateVN(activeStart)} → ${formatDisplayDateVN(activeEnd)}`
              : activeStart
              ? `${formatDisplayDateVN(activeStart)} → Chọn ngày`
              : 'Chọn ngày'}
          </span>
          {nightsCount > 0 && (
            <span
              style={{
                background: 'var(--color-primary-soft)',
                color: 'var(--color-primary)',
                padding: '1px 5px',
                borderRadius: 9999,
                fontSize: '0.7rem',
                fontWeight: 700,
              }}
            >
              {nightsCount} đêm
            </span>
          )}
        </div>
      );
    }

    // Default variant: standard form field pill
    return (
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={e => !disabled && e.key === 'Enter' && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: error ? '1.5px solid var(--color-danger)' : isOpen ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
          borderRadius: 12,
          padding: '0.65rem 0.95rem',
          background: disabled ? 'var(--color-bg-app)' : 'var(--color-bg-surface)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen ? '0 0 0 3px var(--color-primary-soft)' : 'none',
          transition: 'all 0.15s ease',
          opacity: disabled ? 0.7 : 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
          <CalendarEvent style={{ color: isOpen ? 'var(--color-primary)' : 'var(--color-text-muted)', fontSize: '1.05rem', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem' }}>
            <span style={{ fontWeight: activeStart ? 600 : 400, color: activeStart ? 'var(--color-text-primary)' : 'var(--color-text-disabled)' }}>
              {startDisplay}
            </span>
            <span style={{ color: 'var(--color-border-strong)' }}>→</span>
            <span style={{ fontWeight: activeEnd ? 600 : 400, color: activeEnd ? 'var(--color-text-primary)' : 'var(--color-text-disabled)' }}>
              {endDisplay}
            </span>
            {nightsCount > 0 && (
              <span
                style={{
                  background: 'var(--color-primary-soft)',
                  color: 'var(--color-primary)',
                  padding: '1px 6px',
                  borderRadius: 9999,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginLeft: '0.25rem',
                }}
              >
                {nightsCount} đêm
              </span>
            )}
          </div>
        </div>

        {(activeStart || activeEnd) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            title="Chọn lại ngày"
            aria-label="Chọn lại ngày"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--color-text-disabled)',
              display: 'flex',
              alignItems: 'center',
              marginLeft: '0.5rem',
            }}
          >
            <XCircleFill style={{ fontSize: '0.95rem' }} />
          </button>
        )}
      </div>
    );
  };

  const isCompact = variant === 'search-compact';
  const isHero = variant === 'search-hero';

  return (
    <div
      ref={containerRef}
      id={id}
      className={`app-daterangepicker-wrapper app-daterangepicker-${variant} ${className}`}
      style={{
        position: 'relative',
        width: isCompact ? 'auto' : '100%',
        display: isCompact ? 'inline-block' : 'block',
        ...style,
      }}
    >
      {label && variant === 'default' && (
        <label
          style={{
            display: 'block',
            marginBottom: '0.4rem',
            fontWeight: 600,
            fontSize: '0.88rem',
            color: 'var(--color-text-primary)',
          }}
        >
          {label} {required && <span style={{ color: 'var(--color-primary)' }}>*</span>}
        </label>
      )}

      {renderTrigger()}

      {helperText && !error && (
        <span style={{ display: 'block', marginTop: '0.35rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
          {helperText}
        </span>
      )}
      {error && (
        <span style={{ display: 'block', marginTop: '0.35rem', color: 'var(--color-danger)', fontSize: '0.8rem', fontWeight: 500 }}>
          {error}
        </span>
      )}

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: isHero || isCompact ? 'calc(100% + 14px)' : 'calc(100% + 8px)',
            left: align === 'right' ? 'auto' : align === 'center' ? '50%' : 0,
            right: align === 'right' ? 0 : 'auto',
            transform: align === 'center' ? 'translateX(-50%)' : undefined,
            zIndex: 1100,
            animation: 'fadeInSlide 0.15s ease-out',
          }}
        >
          {calendarBody}
        </div>
      )}
    </div>
  );
}
