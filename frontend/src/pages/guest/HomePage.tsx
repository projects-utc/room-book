// ODauDay Stay — Airbnb Vietnam Exact Homepage Layout & Micro-Animations (TypeScript)
import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { PropertyCard } from '../../components/UI';
import SearchBar from '../../components/SearchBar';
import { Search, ChevronLeft, ChevronRight, X } from 'react-bootstrap-icons';
import { Property } from '../../data';

export default function HomePage() {
  const { store } = useStore();
  const navigate = useNavigate();

  const [kw, setKw] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('');
  const [showFeeBadge, setShowFeeBadge] = useState(true);

  const data = store.getData();
  const properties: Property[] = data.properties || [];

  // Group properties into lush, rich destination collections (6-7 items each for wide screens)
  const hanoiSection = [
    ...properties.filter(p => p.city === 'Hà Nội'),
    ...properties.filter(p => p.city === 'Vĩnh Phúc' || p.city === 'Ninh Bình'),
  ];

  const beachSection = [
    ...properties.filter(p => ['Kiên Giang', 'Quảng Ninh', 'Bà Rịa - Vũng Tàu', 'Bình Định', 'Quảng Nam'].includes(p.city)),
  ];

  const mountainSection = [
    ...properties.filter(p => ['Lào Cai', 'Lâm Đồng', 'Vĩnh Phúc', 'Thừa Thiên Huế'].includes(p.city)),
    ...properties.filter(p => p.type.toLowerCase().includes('gỗ') || p.type.toLowerCase().includes('biệt thự')),
  ];

  const topRatedSection = [...properties].sort((a, b) => (b.rating || 5) - (a.rating || 5));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (kw.trim()) params.set('kw', kw.trim());
    if (checkIn) params.set('in', checkIn);
    if (checkOut) params.set('out', checkOut);
    if (guests) params.set('guests', guests);
    navigate(`/search?${params.toString()}`);
  };

  // Destination Section with Horizontal Scroll and < > Buttons
  const DestinationSection = ({ title, linkKw, items }: { title: string; linkKw: string; items: Property[] }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollLeft = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollBy({ left: -360, behavior: 'smooth' });
      }
    };

    const scrollRight = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollBy({ left: 360, behavior: 'smooth' });
      }
    };

    // Remove duplicates if any
    const uniqueItems = Array.from(new Map(items.map(item => [item.id, item])).values());

    return (
      <section style={{ marginBottom: '3.5rem' }}>
        {/* Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <Link
            to={`/search?kw=${encodeURIComponent(linkKw)}`}
            style={{
              fontSize: '1.45rem',
              fontWeight: 700,
              color: '#222222',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              textDecoration: 'none',
              letterSpacing: '-0.02em',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FF385C')}
            onMouseLeave={e => (e.currentTarget.style.color = '#222222')}
          >
            <span>{title}</span>
            <span style={{ fontSize: '1.2rem' }}>→</span>
          </Link>

          {/* Navigation Scroll Buttons */}
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={scrollLeft}
              aria-label="Cuộn sang trái"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: '1px solid #DDDDDD',
                background: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#222222',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#222222';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#DDDDDD';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <ChevronLeft style={{ fontSize: '0.85rem' }} />
            </button>

            <button
              type="button"
              onClick={scrollRight}
              aria-label="Cuộn sang phải"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: '1px solid #DDDDDD',
                background: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#222222',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#222222';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#DDDDDD';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <ChevronRight style={{ fontSize: '0.85rem' }} />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel Row */}
        <div
          ref={scrollContainerRef}
          style={{
            display: 'grid',
            gridAutoFlow: 'column',
            gridAutoColumns: 'minmax(270px, 310px)',
            gap: '18px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            padding: '4px 0 12px',
          }}
          className="no-scrollbar"
        >
          {uniqueItems.map(p => (
            <div key={p.id} style={{ scrollSnapAlign: 'start' }}>
              <PropertyCard
                property={p}
                checkIn={checkIn}
                checkOut={checkOut}
                guests={guests}
                nights={2}
              />
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div style={{ maxWidth: 1760, margin: '0 auto', padding: '0 2.5rem 6rem' }}>
      {/* Big Hero Search Bar (Shared SearchBar Component) */}
      <div style={{ margin: '0.5rem auto 3rem', maxWidth: 880 }}>
        <SearchBar
          variant="hero"
          initialKw={kw}
          initialCheckIn={checkIn}
          initialCheckOut={checkOut}
          initialGuests={guests}
        />
      </div>

      {/* Destination Sections (Horizontal Carousels) */}
      <DestinationSection
        title="Nơi lưu trú được ưa chuộng tại Hà Nội &amp; Hồ Tây"
        linkKw="Hồ Tây"
        items={hanoiSection}
      />

      <DestinationSection
        title="Còn phòng tại Ba Vì &amp; Tam Đảo vào tháng tới"
        linkKw="Ba Vì"
        items={hanoiSection.slice(1).concat(mountainSection.slice(0, 3))}
      />

      <DestinationSection
        title="Biệt thự &amp; Căn hộ nghỉ dưỡng view biển"
        linkKw="Biển"
        items={beachSection}
      />

      <DestinationSection
        title="Nhà gỗ mộc mạc &amp; Săn mây tại Sa Pa, Đà Lạt"
        linkKw="Sa Pa"
        items={mountainSection}
      />

      <DestinationSection
        title="Chỗ ở được đánh giá 5 sao cao nhất"
        linkKw="Hà Nội"
        items={topRatedSection}
      />

      {/* Floating Bottom Pill: "Giá đã bao gồm mọi khoản phí" with dismiss */}
      {showFeeBadge && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 90,
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #DDDDDD',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
            borderRadius: '9999px',
            padding: '0.65rem 1.15rem 0.65rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.88rem',
            fontWeight: 600,
            color: '#222222',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <span style={{ fontSize: '1rem' }}>🏷️</span>
          <span>Giá đã bao gồm mọi khoản phí</span>
          <button
            type="button"
            onClick={() => setShowFeeBadge(false)}
            aria-label="Đóng thông báo"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#717171',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '0.25rem',
            }}
          >
            <X style={{ fontSize: '1.1rem' }} />
          </button>
        </div>
      )}
    </div>
  );
}
