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
              color: idx >= 5 ? '#E11D48' : '#717171',
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

          const isDisabled =
            !isCurrentMonth ||
            (minDate && dateISO < minDate) ||
            (maxDate && dateISO > maxDate) ||
            disabledDates.includes(dateISO);

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
          let textColor = isCurrentMonth ? '#222222' : '#CBD5E1';
          let borderRadius = '50%';
          let fontWeight: number | string = 500;

          if (isDisabled) {
            textColor = '#D1D5DB';
          } else if (isSelected) {
            bg = '#FF385C';
            textColor = '#FFFFFF';
            fontWeight = 700;
            borderRadius = '50%';
          } else if (isInRange) {
            bg = '#FFF1F2';
            textColor = '#E11D48';
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
                background: isInRange ? '#FFF1F2' : 'transparent',
                borderRadius: isRangeStart ? '50% 0 0 50%' : isRangeEnd ? '0 50% 50% 0' : undefined,
              }}
            >
              <button
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && onDateClick(dateISO)}
                onMouseEnter={() => !isDisabled && onDateHover && onDateHover(dateISO)}
                aria-label={dateISO}
                style={{
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: isToday && !isSelected ? '1px solid #FF385C' : 'none',
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
                      background: '#FF385C',
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
  minDate,
  maxDate,
  disabledDates = [],
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
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '1.25rem',
        boxShadow: inline ? 'none' : '0 10px 30px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)',
        border: inline ? '1px solid #E2E8F0' : '1px solid #EBEBEB',
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
            color: '#222222',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <ChevronLeft style={{ fontSize: '0.9rem' }} />
        </button>

        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#222222' }}>
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
            color: '#222222',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')}
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
        onDateClick={handleDateSelect}
      />

      {/* Quick Select Shortcuts */}
      {quickSelect && (
        <div
          style={{
            marginTop: '1rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <ClockHistory /> Chọn nhanh:
          </span>
          <button
            type="button"
            onClick={() => setQuickDate(0)}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => setQuickDate(1)}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            Ngày mai
          </button>
          <button
            type="button"
            onClick={() => setQuickDate(7)}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#334155',
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
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.88rem', color: '#1E293B' }}>
            {label} {required && <span style={{ color: '#E11D48' }}>*</span>}
          </label>
        )}
        {calendarContent}
        {error && <span style={{ display: 'block', marginTop: '0.35rem', color: '#DC2626', fontSize: '0.8rem' }}>{error}</span>}
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
            color: '#1E293B',
          }}
        >
          {label} {required && <span style={{ color: '#E11D48' }}>*</span>}
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
          border: error ? '1.5px solid #DC2626' : isOpen ? '1.5px solid #FF385C' : '1px solid #E2E8F0',
          borderRadius: 12,
          padding: '0.65rem 0.95rem',
          background: disabled ? '#F8FAFC' : '#FFFFFF',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(255, 56, 92, 0.12)' : 'none',
          transition: 'all 0.15s ease',
          opacity: disabled ? 0.7 : 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
          <CalendarEvent style={{ color: isOpen ? '#FF385C' : '#64748B', fontSize: '1.05rem', flexShrink: 0 }} />
          <span
            style={{
              fontSize: '0.92rem',
              color: formattedDisplay ? '#1E293B' : '#94A3B8',
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
            title="Xóa ngày đã chọn"
            aria-label="Xóa ngày"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: '#94A3B8',
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
        <span style={{ display: 'block', marginTop: '0.35rem', color: '#64748B', fontSize: '0.8rem' }}>
          {helperText}
        </span>
      )}
      {error && (
        <span style={{ display: 'block', marginTop: '0.35rem', color: '#DC2626', fontSize: '0.8rem', fontWeight: 500 }}>
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
  minDate,
  maxDate,
  disabledDates = [],
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

  // Calculate nights
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
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '1.25rem',
        boxShadow: inline ? 'none' : '0 10px 30px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)',
        border: inline ? '1px solid #E2E8F0' : '1px solid #EBEBEB',
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
            color: '#222222',
          }}
        >
          <ChevronLeft style={{ fontSize: '0.9rem' }} />
        </button>

        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#222222' }}>
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
            color: '#222222',
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
        onDateClick={handleDateSelect}
        onDateHover={setHoverDate}
      />

      {/* Helper text showing selected nights */}
      <div
        style={{
          marginTop: '0.85rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
          {value.start && value.end
            ? `Đã chọn: ${nightsCount} đêm lưu trú`
            : value.start
            ? 'Vui lòng chọn ngày trả phòng'
            : 'Chọn ngày bắt đầu chuyến đi'}
        </span>

        {(value.start || value.end) && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FF385C',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Đặt lại
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
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            2 đêm
          </button>
          <button
            type="button"
            onClick={() => setQuickRange(3)}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            3 đêm
          </button>
          <button
            type="button"
            onClick={() => setQuickRange(7)}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#334155',
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
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.88rem', color: '#1E293B' }}>
            {label} {required && <span style={{ color: '#E11D48' }}>*</span>}
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
              color: '#222222',
              letterSpacing: '0.02em',
              marginBottom: 2,
            }}
          >
            {label || 'Thời gian'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem' }}>
            {!value.start && !value.end ? (
              <span style={{ color: '#717171', fontWeight: 400 }}>Thêm ngày</span>
            ) : value.start && !value.end ? (
              <>
                <span style={{ fontWeight: 600, color: '#222222' }}>{formatDisplayDateVN(value.start)}</span>
                <span style={{ color: '#B0B0B0', fontSize: '0.8rem' }}>→</span>
                <span style={{ color: '#717171' }}>Thêm ngày trả</span>
              </>
            ) : !value.start && value.end ? (
              <span style={{ fontWeight: 600, color: '#222222' }}>{formatDisplayDateVN(value.end)}</span>
            ) : (
              <>
                <span style={{ fontWeight: 600, color: '#222222' }}>{formatDisplayDateVN(value.start)}</span>
                <span style={{ color: '#B0B0B0', fontSize: '0.8rem' }}>→</span>
                <span style={{ fontWeight: 600, color: '#222222' }}>{formatDisplayDateVN(value.end)}</span>
                {nightsCount > 0 && (
                  <span
                    style={{
                      background: '#FFF1F2',
                      color: '#E11D48',
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
            color: '#222222',
            userSelect: 'none',
          }}
        >
          <Calendar3 style={{ color: '#717171', fontSize: '0.85rem', flexShrink: 0 }} />
          <span>
            {value.start && value.end
              ? `${formatDisplayDateVN(value.start)} → ${formatDisplayDateVN(value.end)}`
              : 'Thời gian bất kỳ'}
          </span>
          {nightsCount > 0 && (
            <span
              style={{
                background: '#FFF1F2',
                color: '#E11D48',
                padding: '1px 5px',
                borderRadius: 9999,
                fontSize: '0.7rem',
                fontWeight: 700,
              }}
            >
              {nightsCount}đ
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
            color: '#1E293B',
          }}
        >
          {label} {required && <span style={{ color: '#E11D48' }}>*</span>}
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
          border: error ? '1.5px solid #DC2626' : isOpen ? '1.5px solid #FF385C' : '1px solid #E2E8F0',
          borderRadius: 12,
          padding: '0.65rem 0.95rem',
          background: disabled ? '#F8FAFC' : '#FFFFFF',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(255, 56, 92, 0.12)' : 'none',
          transition: 'all 0.15s ease',
          opacity: disabled ? 0.7 : 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
          <CalendarEvent style={{ color: isOpen ? '#FF385C' : '#64748B', fontSize: '1.05rem', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem' }}>
            <span style={{ fontWeight: value.start ? 600 : 400, color: value.start ? '#1E293B' : '#94A3B8' }}>
              {startDisplay}
            </span>
            <span style={{ color: '#CBD5E1' }}>→</span>
            <span style={{ fontWeight: value.end ? 600 : 400, color: value.end ? '#1E293B' : '#94A3B8' }}>
              {endDisplay}
            </span>
            {nightsCount > 0 && (
              <span
                style={{
                  background: '#FFF1F2',
                  color: '#E11D48',
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
            title="Xóa khoảng ngày"
            aria-label="Xóa khoảng ngày"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: '#94A3B8',
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
        <span style={{ display: 'block', marginTop: '0.35rem', color: '#64748B', fontSize: '0.8rem' }}>
          {helperText}
        </span>
      )}
      {error && (
        <span style={{ display: 'block', marginTop: '0.35rem', color: '#DC2626', fontSize: '0.8rem', fontWeight: 500 }}>
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
