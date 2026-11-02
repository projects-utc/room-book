import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, GeoAlt, Calendar3, People, XCircle } from 'react-bootstrap-icons';
import { DateRangePicker } from './DatePicker';

export interface SearchBarProps {
  initialKw?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: string;
  variant?: 'hero' | 'compact';
  onSearch?: (params: { kw: string; checkIn: string; checkOut: string; guests: string }) => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function SearchBar({
  initialKw = '',
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests = '',
  variant = 'hero',
  onSearch,
  className = '',
  style = {},
}: SearchBarProps) {
  const navigate = useNavigate();

  const [kw, setKw] = useState(initialKw);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);

  // Sync state if props change (e.g. user navigates with different query params)
  useEffect(() => {
    setKw(initialKw);
  }, [initialKw]);

  useEffect(() => {
    setCheckIn(initialCheckIn);
  }, [initialCheckIn]);

  useEffect(() => {
    setCheckOut(initialCheckOut);
  }, [initialCheckOut]);

  useEffect(() => {
    setGuests(initialGuests);
  }, [initialGuests]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (onSearch) {
      onSearch({ kw, checkIn, checkOut, guests });
    } else {
      const params = new URLSearchParams();
      if (kw.trim()) params.set('kw', kw.trim());
      if (checkIn) params.set('in', checkIn);
      if (checkOut) params.set('out', checkOut);
      if (guests) params.set('guests', guests);
      const query = params.toString();
      navigate(`/search${query ? '?' + query : ''}`);
    }
  };

  /* ──────────────────────────────────────────────────────────────────────────
     Variant: HERO (Used on Homepage)
     ────────────────────────────────────────────────────────────────────────── */
  if (variant === 'hero') {
    return (
      <form onSubmit={handleSubmit} style={{ width: '100%', ...style }} className={className}>
        <div
          className="search-pill-wrapper"
          style={{
            maxWidth: 880,
            margin: '0 auto',
            padding: '0.45rem 0.55rem 0.45rem 1.75rem',
            borderRadius: '9999px',
            boxShadow: '0 3px 12px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Destination */}
          <div style={{ flex: '1.2', minWidth: 160 }}>
            <label
              htmlFor="hero-search-dest"
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#222222',
                letterSpacing: '0.02em',
                marginBottom: 2,
              }}
            >
              Địa điểm
            </label>
            <input
              id="hero-search-dest"
              type="text"
              placeholder="Tìm kiếm điểm đến"
              value={kw}
              onChange={e => setKw(e.target.value)}
              className="search-raw-input"
              style={{
                fontSize: '0.9rem',
                width: '100%',
              }}
            />
          </div>

          <div style={{ width: 1, height: 32, background: '#EBEBEB', margin: '0 1rem', flexShrink: 0 }} />

          {/* Time / Dates with standard DateRangePicker */}
          <div style={{ flex: '1.4', minWidth: 200 }}>
            <DateRangePicker
              variant="search-hero"
              label="Thời gian"
              value={{ start: checkIn, end: checkOut }}
              onChange={range => {
                setCheckIn(range.start);
                if (range.end) setCheckOut(range.end);
              }}
              align="center"
            />
          </div>

          <div style={{ width: 1, height: 32, background: '#EBEBEB', margin: '0 1rem', flexShrink: 0 }} />

          {/* Guests */}
          <div style={{ flex: '0.8', minWidth: 100 }}>
            <label
              htmlFor="hero-search-guests"
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#222222',
                letterSpacing: '0.02em',
                marginBottom: 2,
              }}
            >
              Khách
            </label>
            <select
              id="hero-search-guests"
              value={guests}
              onChange={e => setGuests(e.target.value)}
              className="search-raw-input"
              style={{
                fontSize: '0.88rem',
                cursor: 'pointer',
                width: '100%',
                color: guests ? '#222222' : '#717171',
                fontWeight: guests ? 600 : 400,
              }}
            >
              <option value="">Thêm khách</option>
              <option value="1">1 khách</option>
              <option value="2">2 khách</option>
              <option value="3">3 khách</option>
              <option value="4">4 khách</option>
              <option value="5">5+ khách</option>
            </select>
          </div>

          {/* Search Action Button */}
          <button
            type="submit"
            className="btn-primary"
            style={{
              background: '#FF385C',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginLeft: '0.75rem',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(255, 56, 92, 0.4)',
              transition: 'all 0.2s ease',
            }}
            aria-label="Bắt đầu tìm kiếm"
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.background = '#E00B41';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = '#FF385C';
            }}
          >
            <Search style={{ fontSize: '1.05rem', strokeWidth: 1 }} />
          </button>
        </div>
      </form>
    );
  }

  /* ──────────────────────────────────────────────────────────────────────────
     Variant: COMPACT (Used on Search Results & Inner Pages)
     Strictly prevents wrapping, keeps all elements in 1 clean horizontal row
     ────────────────────────────────────────────────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} style={{ display: 'inline-block', maxWidth: '100%', ...style }} className={className}>
      <div
        className="search-pill-wrapper"
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'nowrap',
          padding: '0.35rem 0.5rem 0.35rem 1rem',
          borderRadius: '9999px',
          gap: '0.5rem',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Destination */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 130, flex: '1' }}>
          <GeoAlt style={{ color: '#FF385C', fontSize: '0.9rem', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Điểm đến (Hà Nội, Sa Pa...)"
            value={kw}
            onChange={e => setKw(e.target.value)}
            className="search-raw-input"
            style={{
              fontSize: '0.86rem',
              fontWeight: 600,
              minWidth: 100,
              width: '100%',
            }}
          />
        </div>

        <div style={{ width: 1, height: 22, background: '#EBEBEB', flexShrink: 0, margin: '0 0.25rem' }} />

        {/* Dates with standard DateRangePicker */}
        <div style={{ flexShrink: 0 }}>
          <DateRangePicker
            variant="search-compact"
            value={{ start: checkIn, end: checkOut }}
            onChange={range => {
              setCheckIn(range.start);
              if (range.end) setCheckOut(range.end);
            }}
            align="center"
          />
        </div>

        <div style={{ width: 1, height: 22, background: '#EBEBEB', flexShrink: 0, margin: '0 0.25rem' }} />

        {/* Guests */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
          <People style={{ color: '#717171', fontSize: '0.85rem', flexShrink: 0 }} />
          <select
            value={guests}
            onChange={e => setGuests(e.target.value)}
            className="search-raw-input"
            style={{
              fontSize: '0.82rem',
              fontWeight: guests ? 600 : 400,
              color: guests ? '#222222' : '#717171',
              cursor: 'pointer',
              width: '95px',
            }}
          >
            <option value="">Thêm khách</option>
            <option value="1">1 khách</option>
            <option value="2">2 khách</option>
            <option value="3">3 khách</option>
            <option value="4">4 khách</option>
            <option value="5">5+ khách</option>
          </select>
        </div>

        {/* Search Submit Button */}
        <button
          type="submit"
          style={{
            background: '#FF385C',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            marginLeft: '0.35rem',
            transition: 'background 0.15s ease',
          }}
          aria-label="Tìm kiếm"
          onMouseEnter={e => (e.currentTarget.style.background = '#E00B41')}
          onMouseLeave={e => (e.currentTarget.style.background = '#FF385C')}
        >
          <Search style={{ fontSize: '0.85rem' }} />
        </button>
      </div>
    </form>
  );
}
