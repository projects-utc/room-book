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
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${day} thg ${month}, ${year}`;
}

const WEEKDAY_NAMES_VN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_NAMES_VN = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

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

// ── Core Calendar Grid Component ───────────────────────────────────────────────

interface CalendarGridProps {
  viewYear: number;
  viewMonth: number; // 0-11
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

  // Calculate days in current month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // First day of current month: Day of week (0 = Sun, 1 = Mon ... 6 = Sat)
  const firstDayWeekday = new Date(viewYear, viewMonth, 1).getDay();
  // We want Monday = 0, Tuesday = 1, ..., Sunday = 6
  const startOffset = (firstDayWeekday + 6) % 7;

  // Days in previous month to fill leading slots
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Range bounds calculation
  const effectiveEnd = endDate || (startDate && hoverDate && hoverDate >= startDate ? hoverDate : undefined);

  const gridCells = useMemo(() => {
    const cells: { dateISO: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

    // Prev month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonthDate = new Date(viewYear, viewMonth - 1, d);
      cells.push({
        dateISO: formatDateToISO(prevMonthDate),
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const currDate = new Date(viewYear, viewMonth, d);
      cells.push({
        dateISO: formatDateToISO(currDate),
        dayNumber: d,
        isCurrentMonth: true,
      });
    }

    // Next month days to make complete 35 or 42 cells grid
    const totalSlots = cells.length <= 35 ? 35 : 42;
    const remaining = totalSlots - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonthDate = new Date(viewYear, viewMonth + 1, d);
      cells.push({
        dateISO: formatDateToISO(nextMonthDate),
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [viewYear, viewMonth, startOffset, daysInMonth, daysInPrevMonth]);

  return (
      <div style={{ width: '100%' }}>
        {/* Weekday Labels Header */}
        <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              marginBottom: '0.5rem',
            }}
        >
          {WEEKDAY_NAMES_VN.map((day, idx) => (
              <span
                  key={day}
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: idx >= 5 ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    padding: '4px 0',
                  }}
              >
            {day}
          </span>
          ))}
        </div>

        {/* Days Grid */}
        <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              rowGap: '2px',
            }}
            onMouseLeave={() => onDateHover && onDateHover(null)}
        >
          {gridCells.map(cell => {
            const { dateISO, dayNumber, isCurrentMonth } = cell;

            // LOGIC KHÓA NGÀY (Disabled): Kiểm tra bằng minDate, maxDate, disabledDates (mảng) VÀ isDateDisabled (hàm)
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

            // Compute cell styles
            let bg = 'transparent';
            let textColor = isCurrentMonth ? 'var(--color-text-primary)' : 'var(--color-border-strong)';
            let borderRadius = '50%';
            let fontWeight: number | string = 500;

            if (isDisabled) {
              // Ngày bị vô hiệu hóa sẽ có màu xám mờ và gạch ngang
              textColor = 'var(--color-text-disabled)';
              bg = 'transparent'; // Không tô màu nền cho ngày bị vô hiệu hóa (ngay cả khi nó nằm trong khoảng)
            } else if (isSelected) {
              bg = 'var(--color-primary)';
              textColor = 'var(--color-bg-surface)';
              fontWeight = 700;
              borderRadius = '50%';
            } else if (isInRange) {
              bg = 'var(--color-primary-soft)';
              textColor = 'var(--color-primary)';
              fontWeight = 600;
              borderRadius = '0';
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
                        textDecoration: isDisabled ? 'line-through' : 'none', // Thêm gạch ngang cho ngày bận
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

  const initialDate = parseISODate(value) || new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // Close popup when clicking outside
  useEffect(() => {
    if (inline) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inline]);

  // Sync view when value changes
  useEffect(() => {
    if (value) {
      const parsed = parseISODate(value);
      if (parsed) {
        setViewYear(parsed.getFullYear());
        setViewMonth(parsed.getMonth());
      }
    }
  }, [value]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleDateSelect = (isoDate: string) => {
    onChange && onChange(isoDate);
    if (!inline) setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange && onChange('');
  };

  const setQuickDate = (daysFromNow: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    const iso = formatDateToISO(target);
    onChange && onChange(iso);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    if (!inline) setIsOpen(false);
  };

  const formattedDisplay = value ? formatDisplayDateVN(value) : '';

  const calendarContent = (
      <div
          style={{
            background: 'var(--color-bg-surface)',
            borderRadius: 16,
            padding: '1.25rem',
            boxShadow: inline ? 'none' : 'var(--shadow-dropdown)',
            border: inline ? '1px solid var(--color-border-subtle)' : '1px solid var(--color-border-subtle)',
            width: 320,
            zIndex: inline ? 1 : 1050,
          }}
      >
        {/* Month Navigation Header */}
        <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
        >
          <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Tháng trước"
              style={{
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
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-muted)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <ChevronLeft style={{ fontSize: '0.9rem' }} />
          </button>

          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {MONTH_NAMES_VN[viewMonth]} năm {viewYear}
        </span>

          <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Tháng sau"
              style={{
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
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-muted)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <ChevronRight style={{ fontSize: '0.9rem' }} />
          </button>
        </div>

        {/* Calendar Grid */}
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

        {/* Quick Select Shortcuts */}
        {quickSelect && (
            <div
                style={{
                  marginTop: '1rem',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--color-bg-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  flexWrap: 'wrap',
                }}
            >
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <ClockHistory /> Chọn nhanh:
          </span>
              <button
                  type="button"
                  onClick={() => setQuickDate(0)}
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
                Hôm nay
              </button>
              <button
                  type="button"
                  onClick={() => setQuickDate(1)}
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
                Ngày mai
              </button>
              <button
                  type="button"
                  onClick={() => setQuickDate(7)}
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
                +1 Tuần
              </button>
            </div>
        )}
      </div>
  );

  if (inline) {
    return (
        <div className={`app-datepicker-inline ${className}`} style={{ ...style }}>
          {label && (
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>
                {label} {required && <span style={{ color: 'var(--color-primary)' }}>*</span>}
              </label>
          )}
          {calendarContent}
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

        {/* Input Display Trigger */}
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

        {/* Floating Popover Calendar */}
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
              {calendarContent}
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
                                  className = '',
                                  style,
                                }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate = parseISODate(value.start) || new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  useEffect(() => {
    if (inline) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inline]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleDateSelect = (isoDate: string) => {
    if (!value.start || (value.start && value.end)) {
      // Start fresh selection
      onChange && onChange({ start: isoDate, end: '' });
    } else if (value.start && !value.end) {
      if (isoDate >= value.start) {
        onChange && onChange({ start: value.start, end: isoDate });
        if (!inline) setIsOpen(false);
      } else {
        // Picked date before start date, treat as new start date
        onChange && onChange({ start: isoDate, end: '' });
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange && onChange({ start: '', end: '' });
  };

  // Quick preset shortcuts (Cuối tuần, 2 đêm, 1 tuần)
  const setQuickRange = (nights: number) => {
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + nights);
    const range = {
      start: formatDateToISO(start),
      end: formatDateToISO(end),
    };
    onChange && onChange(range);
    setViewYear(start.getFullYear());
    setViewMonth(start.getMonth());
    if (!inline) setIsOpen(false);
  };

  const startDisplay = value.start ? formatDisplayDateVN(value.start) : 'Nhận phòng';
  const endDisplay = value.end ? formatDisplayDateVN(value.end) : 'Trả phòng';

  // Sửa lỗi tính ngày (trước đây có đoạn lỗi gạch đầu dòng)
  let nightsCount = 0;
  if (value.start && value.end) {
    const s = parseISODate(value.start);
    const e = parseISODate(value.end);
    if (s && e) {
      nightsCount = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  const calendarContent = (
      <div
          style={{
            background: 'var(--color-bg-surface)',
            borderRadius: 16,
            padding: '1.25rem',
            boxShadow: inline ? 'none' : 'var(--shadow-dropdown)',
            border: inline ? '1px solid var(--color-border-subtle)' : '1px solid var(--color-border-subtle)',
            width: 330,
            zIndex: inline ? 1 : 1050,
          }}
      >
        {/* Month Navigation */}
        <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
        >
          <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Tháng trước"
              style={{
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
              }}
          >
            <ChevronLeft style={{ fontSize: '0.9rem' }} />
          </button>

          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {MONTH_NAMES_VN[viewMonth]} năm {viewYear}
        </span>

          <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Tháng sau"
              style={{
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
              }}
          >
            <ChevronRight style={{ fontSize: '0.9rem' }} />
          </button>
        </div>

        {/* Grid */}
        <CalendarGrid
            viewYear={viewYear}
            viewMonth={viewMonth}
            mode="range"
            startDate={value.start}
            endDate={value.end}
            hoverDate={hoverDate || undefined}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
            isDateDisabled={isDateDisabled}
            onDateClick={handleDateSelect}
            onDateHover={setHoverDate}
        />

        {/* Helper text showing selected nights */}
        <div
            style={{
              marginTop: '0.85rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--color-bg-muted)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
        >
        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
          {value.start && value.end
              ? `Đã chọn: ${nightsCount} đêm lưu trú`
              : value.start
                  ? 'Vui lòng chọn ngày trả phòng'
                  : 'Vui lòng chọn ngày nhận phòng'}
        </span>

          {(value.start || value.end) && (
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

        {/* Quick Select Presets */}
        {quickSelect && (
            <div
                style={{
                  marginTop: '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  flexWrap: 'wrap',
                }}
            >
              <button
                  type="button"
                  onClick={() => setQuickRange(2)}
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
                2 đêm
              </button>
              <button
                  type="button"
                  onClick={() => setQuickRange(3)}
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
                3 đêm
              </button>
              <button
                  type="button"
                  onClick={() => setQuickRange(7)}
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
                1 tuần
              </button>
            </div>
        )}
      </div>
  );

  if (inline) {
    return (
        <div className={`app-daterangepicker-inline ${className}`} style={{ ...style }}>
          {label && (
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>
                {label} {required && <span style={{ color: 'var(--color-primary)' }}>*</span>}
              </label>
          )}
          {calendarContent}
        </div>
    );
  }

  // Variant: search-hero (used in main Hero Search Bar on Homepage)
  if (variant === 'search-hero') {
    return (
        <div
            ref={containerRef}
            className={`app-daterangepicker-hero ${className}`}
            style={{ position: 'relative', width: '100%', ...style }}
        >
          <div
              role="button"
              tabIndex={disabled ? -1 : 0}
              onClick={() => !disabled && setIsOpen(!isOpen)}
              onKeyDown={e => !disabled && e.key === 'Enter' && setIsOpen(!isOpen)}
              style={{
                cursor: disabled ? 'not-allowed' : 'pointer',
                userSelect: 'none',
                padding: '2px 0',
              }}
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
              {!value.start && !value.end ? (
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>Chọn ngày</span>
              ) : value.start && !value.end ? (
                <>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatDisplayDateVN(value.start)}</span>
                  <span style={{ color: 'var(--color-text-disabled)', fontSize: '0.8rem' }}>→</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Chọn ngày trả phòng</span>
                </>
              ) : !value.start && value.end ? (
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatDisplayDateVN(value.end)}</span>
              ) : (
                <>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatDisplayDateVN(value.start)}</span>
                  <span style={{ color: 'var(--color-text-disabled)', fontSize: '0.8rem' }}>→</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatDisplayDateVN(value.end)}</span>
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

          {isOpen && (
              <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 14px)',
                    left: align === 'right' ? 'auto' : align === 'center' ? '50%' : 0,
                    right: align === 'right' ? 0 : 'auto',
                    transform: align === 'center' ? 'translateX(-50%)' : undefined,
                    zIndex: 1100,
                    animation: 'fadeInSlide 0.15s ease-out',
                  }}
              >
                {calendarContent}
              </div>
          )}
        </div>
    );
  }

  // Variant: search-compact (used in Compact horizontal Search Bar)
  if (variant === 'search-compact') {
    return (
        <div
            ref={containerRef}
            className={`app-daterangepicker-compact ${className}`}
            style={{ position: 'relative', display: 'inline-block', ...style }}
        >
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
            {value.start && value.end
                ? `${formatDisplayDateVN(value.start)} → ${formatDisplayDateVN(value.end)}`
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

          {isOpen && (
              <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 14px)',
                    left: align === 'right' ? 'auto' : align === 'center' ? '50%' : 0,
                    right: align === 'right' ? 0 : 'auto',
                    transform: align === 'center' ? 'translateX(-50%)' : undefined,
                    zIndex: 1100,
                    animation: 'fadeInSlide 0.15s ease-out',
                  }}
              >
                {calendarContent}
              </div>
          )}
        </div>
    );
  }

  return (
      <div
          ref={containerRef}
          className={`app-daterangepicker-wrapper ${className}`}
          style={{ position: 'relative', width: '100%', ...style }}
      >
        {label && (
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

        {/* 2-Part Date Display Pill */}
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
            <span style={{ fontWeight: value.start ? 600 : 400, color: value.start ? 'var(--color-text-primary)' : 'var(--color-text-disabled)' }}>
              {startDisplay}
            </span>
              <span style={{ color: 'var(--color-border-strong)' }}>→</span>
              <span style={{ fontWeight: value.end ? 600 : 400, color: value.end ? 'var(--color-text-primary)' : 'var(--color-text-disabled)' }}>
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

          {(value.start || value.end) && !disabled && (
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
              {calendarContent}
            </div>
        )}
      </div>
  );
}