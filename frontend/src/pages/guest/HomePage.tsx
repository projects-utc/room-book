// ODauDay Stay — Airbnb Vietnam Exact Homepage Layout & Micro-Animations (TypeScript)
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { PropertyCard } from '../../components/UI';
import SearchBar from '../../components/SearchBar';
import { ChevronLeft, ChevronRight, GeoAlt, Tag, Check, Copy, XCircle, Gift } from 'react-bootstrap-icons';
import { Property } from '../../data';
import { stayApi } from '../../api/stayApi';
import { useQuery } from '../../hooks/useQuery';

// 10 Điểm đến du lịch hàng đầu Việt Nam
const TOP_DESTINATIONS = [
  {
    city: 'Hà Nội',
    subtitle: 'Thủ đô cổ kính & Hồ Tây',
    image: 'https://images.unsplash.com/photo-1509030450996-93529321f2bb?auto=format&fit=crop&w=600&q=80',
  },
  {
    city: 'TP. Hồ Chí Minh',
    subtitle: 'Đô thị phồn hoa & Landmark',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
  },
  {
    city: 'Đà Nẵng',
    subtitle: 'Cầu Rồng & Biển Mỹ Khê',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80',
  },
  {
    city: 'Sa Pa',
    subtitle: 'Thung lũng săn mây',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
  },
  {
    city: 'Đà Lạt',
    subtitle: 'Đồi thông ngàn hoa',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
  },
  {
    city: 'Phú Quốc',
    subtitle: 'Đảo ngọc hoàng hôn',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
  },
  {
    city: 'Vũng Tàu',
    subtitle: 'Biển xanh lộng gió',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
  },
  {
    city: 'Ninh Bình',
    subtitle: 'Danh thắng Tràng An',
    image: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=600&q=80',
  },
  {
    city: 'Hội An',
    subtitle: 'Phố cổ đèn lồng',
    image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=600&q=80',
  },
  {
    city: 'Nha Trang',
    subtitle: 'Vịnh biển xanh ngắt',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
  },
];

export default function HomePage() {
  const { store } = useStore();
  const [searchParams] = useSearchParams();

  const kw = searchParams.get('kw') || '';
  const checkIn = searchParams.get('in') || '';
  const checkOut = searchParams.get('out') || '';
  const guests = searchParams.get('guests') || '';

  // Điểm đến được chọn lọc
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Trạng thái sao chép voucher
  const [copiedPromo, setCopiedPromo] = useState<string | null>(null);
  const handleCopyPromo = (code: string) => {
    try {
      navigator.clipboard?.writeText(code);
      setCopiedPromo(code);
      setTimeout(() => setCopiedPromo(null), 2000);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    const sec = searchParams.get('section');
    if (sec === 'trending') {
      setTimeout(() => {
        document.getElementById('hot-trending-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else if (sec === 'explore') {
      setTimeout(() => {
        document.getElementById('explore-destinations-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else if (sec === 'stays') {
      setTimeout(() => {
        document.getElementById('stays-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [searchParams]);

  // Hàm fetch danh sách phòng và đánh giá từ Backend
  const fetchPropertiesWithReviews = useCallback(async (): Promise<Property[]> => {
    try {
      const [resProps, resRevs] = await Promise.all([
        stayApi.getProperties(),
        stayApi.getReviews().catch(() => ({ success: false, data: [] })),
      ]);

      if (resProps.success && Array.isArray(resProps.data) && resProps.data.length > 0) {
        const revs = resRevs.success && Array.isArray(resRevs.data) ? resRevs.data : [];
        return resProps.data.map(p => {
          const propReviews = revs.filter(r => Number(r.propertyId) === Number(p.id));
          const isGuestFavorite = Boolean(
            p.isGuestFavorite !== undefined ? p.isGuestFavorite : p.badge === 'Yêu thích nhất'
          );
          const isTrending = Boolean(
            p.isTrending !== undefined ? p.isTrending : (p.badge === 'Đang Hot' || p.badge === 'Mới ra mắt')
          );
          const isHot = Boolean(p.isHot !== undefined ? p.isHot : (isTrending || p.badge === 'Đang Hot'));

          if (propReviews.length > 0) {
            const sum = propReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
            const avg = Math.round((sum / propReviews.length) * 10) / 10;
            return {
              ...p,
              rating: avg,
              averageRating: avg,
              reviewsCount: propReviews.length,
              reviewCount: propReviews.length,
              isGuestFavorite,
              isTrending,
              isHot,
            };
          }

          if (p.reviewsCount && p.reviewsCount > 0 && p.rating && p.rating > 0) {
            return {
              ...p,
              isGuestFavorite,
              isTrending,
              isHot,
            };
          }

          return {
            ...p,
            rating: null,
            averageRating: null,
            reviewsCount: 0,
            reviewCount: 0,
            isGuestFavorite,
            isTrending,
            isHot,
          };
        });
      }
    } catch (err) {
      console.warn('Lỗi khi fetch danh sách phòng:', err);
    }

    return store.getData().properties || [];
  }, [store]);

  // Thay thế useEffect fetch data cũ bằng React Query (useQuery) hỗ trợ Polling mỗi 30 giây
  // keepPreviousData: true giúp giao diện giữ nguyên không bị giật lác (anti-flicker) khi fetch ngầm
  const { data: properties = store.getData().properties || [] } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: fetchPropertiesWithReviews,
    refetchInterval: 30000, // Tự động refetch API ngầm mỗi 30 giây
    keepPreviousData: true,
  });

  // Khu vực 1: Lọc danh sách phòng Hot / Xu hướng hiện nay (isHot hoặc isTrending từ Backend)
  const hotProperties = useMemo(() => {
    const filtered = properties.filter(
      p =>
        p.isHot === true ||
        p.isTrending === true ||
        p.badge === 'Yêu thích nhất' ||
        p.badge === 'Đang Hot'
    );
    // Fallback nếu chưa có cờ: lấy top phòng có rating cao nhất hoặc 5 phòng nổi bật
    return filtered.length > 0 ? filtered : properties.slice(0, 5);
  }, [properties]);

  // Tính số lượng chỗ ở cho từng điểm đến
  const destinationsWithCount = useMemo(() => {
    return TOP_DESTINATIONS.map(d => {
      const count = properties.filter(p => {
        const c = (p.city || '').toLowerCase();
        const a = (p.area || '').toLowerCase();
        const addr = (p.address || '').toLowerCase();
        const target = d.city.toLowerCase();
        return c.includes(target) || a.includes(target) || addr.includes(target);
      }).length;
      return { ...d, count };
    });
  }, [properties]);

  // Xử lý chọn/bỏ chọn điểm đến
  const handleSelectCity = (city: string) => {
    if (selectedCity === city) {
      setSelectedCity(null);
    } else {
      setSelectedCity(city);
      setCurrentPage(1);
      setTimeout(() => {
        document.getElementById('stays-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  // Khu vực 3: Danh sách phòng ở mục "Bộ sưu tập chỗ ở" - Lọc theo điểm đến nếu được chọn
  const filteredProperties = useMemo(() => {
    if (!selectedCity) return properties;
    const target = selectedCity.toLowerCase();
    return properties.filter(p => {
      const c = (p.city || '').toLowerCase();
      const a = (p.area || '').toLowerCase();
      const addr = (p.address || '').toLowerCase();
      return c.includes(target) || a.includes(target) || addr.includes(target);
    });
  }, [properties, selectedCity]);

  // Ref và hàm cuộn ngang cho Phòng Hot ("nếu có nhiều thì cho lướt sang bên")
  const hotScrollRef = useRef<HTMLDivElement>(null);

  const scrollHotLeft = () => {
    if (hotScrollRef.current) {
      const scrollStep = hotScrollRef.current.clientWidth * 0.75;
      hotScrollRef.current.scrollBy({ left: -scrollStep, behavior: 'smooth' });
    }
  };

  const scrollHotRight = () => {
    if (hotScrollRef.current) {
      const scrollStep = hotScrollRef.current.clientWidth * 0.75;
      hotScrollRef.current.scrollBy({ left: scrollStep, behavior: 'smooth' });
    }
  };

  // Phân trang cho "Bộ sưu tập chỗ ở": 2 hàng (10 phòng mỗi trang với 5 cột)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / itemsPerPage));

  const paginatedExploreProperties = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProperties.slice(start, start + itemsPerPage);
  }, [filteredProperties, currentPage, itemsPerPage]);

  const staysSectionRef = useRef<HTMLElement>(null);

  const handlePrevPage = () => {
    setCurrentPage(prev => {
      const next = Math.max(prev - 1, 1);
      if (next !== prev && staysSectionRef.current) {
        staysSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return next;
    });
  };

  const handleNextPage = () => {
    setCurrentPage(prev => {
      const next = Math.min(prev + 1, totalPages);
      if (next !== prev && staysSectionRef.current) {
        staysSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return next;
    });
  };

  return (
    <div style={{ maxWidth: 1760, margin: '0 auto', padding: '0 2.5rem 6rem' }}>
      {/* Big Hero Search Bar (Shared SearchBar Component) */}
      <div style={{ margin: '0.5rem auto 2rem', maxWidth: 880 }}>
        <SearchBar
          variant="hero"
          initialKw={kw}
          initialCheckIn={checkIn}
          initialCheckOut={checkOut}
          initialGuests={guests}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          KHU VỰC 1: 🔥 Xu hướng hiện nay (Phòng Hot) - Lướt ngang nếu nhiều phòng, thẻ chuẩn kích thước
          ───────────────────────────────────────────────────────────────── */}
      <section id="hot-trending-section" style={{ marginBottom: '1.5rem', scrollMarginTop: '5rem' }}>
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <h2
              className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 m-0"
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--color-text-primary, #0F172A)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>🔥 Xu hướng hiện nay</span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: '#FFF1F2',
                  color: '#E11D48',
                  border: '1px solid #FECDD3',
                }}
              >
                Phòng Hot
              </span>
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary, #475569)',
                margin: '0.35rem 0 0',
              }}
            >
              Những chỗ ở được đặt nhiều nhất và quan tâm đặc biệt trong tuần qua
            </p>
          </div>

          {/* Nút lướt sang bên nếu có nhiều phòng xu hướng */}
          {hotProperties.length > 5 && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={scrollHotLeft}
                aria-label="Cuộn sang trái"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: '1px solid var(--color-border-strong, #CBD5E1)',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-primary, #0F172A)',
                  boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))',
                  transition: 'all 0.15s ease',
                }}
              >
                <ChevronLeft style={{ fontSize: '0.85rem' }} />
              </button>
              <button
                type="button"
                onClick={scrollHotRight}
                aria-label="Cuộn sang phải"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: '1px solid var(--color-border-strong, #CBD5E1)',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-primary, #0F172A)',
                  boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))',
                  transition: 'all 0.15s ease',
                }}
              >
                <ChevronRight style={{ fontSize: '0.85rem' }} />
              </button>
            </div>
          )}
        </div>

        {/* Thanh trượt ngang lướt sang bên, kích thước thẻ bằng 100% thẻ dưới */}
        <div ref={hotScrollRef} className="trending-slider">
          {hotProperties.map(property => (
            <div key={property.id} className="trending-card-item">
              <PropertyCard
                property={property}
                checkIn={checkIn}
                checkOut={checkOut}
                guests={guests}
                nights={2}
                isHotSection={true}
                aspectRatio="16 / 10"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          ĐƯỜNG KẺ NGANG (DIVIDER) TINH TẾ
          ───────────────────────────────────────────────────────────────── */}
      <div
        style={{
          margin: '2.5rem 0 2rem',
          borderTop: '1px solid var(--color-border-subtle, #E2E8F0)',
        }}
      />

      {/* ─────────────────────────────────────────────────────────────────
          KHU VỰC 2: 🧭 Khám phá điểm đến nổi bật (Top Điểm đến Việt Nam)
          ───────────────────────────────────────────────────────────────── */}
      <section id="explore-destinations-section" style={{ marginBottom: '2.5rem', scrollMarginTop: '5rem' }}>
        <div id="explore-section" style={{ position: 'relative', top: '-5rem' }} />
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <h2
              className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 m-0"
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--color-text-primary, #0F172A)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>🧭 Khám phá điểm đến nổi bật</span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: '#EFF6FF',
                  color: '#2563EB',
                  border: '1px solid #BFDBFE',
                }}
              >
                Việt Nam
              </span>
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary, #475569)',
                margin: '0.35rem 0 0',
              }}
            >
              Các thành phố và thiên đường du lịch hàng đầu được du khách yêu thích nhất
            </p>
          </div>

          {selectedCity && (
            <button
              type="button"
              onClick={() => setSelectedCity(null)}
              style={{
                background: 'none',
                border: '1px solid var(--color-border-strong, #CBD5E1)',
                padding: '0.35rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--color-text-secondary, #475569)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <XCircle /> Bỏ chọn điểm đến
            </button>
          )}
        </div>

        {/* Lưới 10 điểm đến hàng đầu */}
        <div className="destination-grid">
          {destinationsWithCount.map(dest => {
            const isSelected = selectedCity === dest.city;
            return (
              <div
                key={dest.city}
                className={`destination-card ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectCity(dest.city)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleSelectCity(dest.city)}
              >
                <img src={dest.image} alt={dest.city} loading="lazy" />
                <div className="destination-card-overlay">
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '9999px',
                        background: 'rgba(255, 255, 255, 0.88)',
                        color: isSelected ? 'var(--color-primary, #E11D48)' : '#0F172A',
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      }}
                    >
                      {dest.count > 0 ? `${dest.count} chỗ ở` : 'Đang cập nhật'}
                    </span>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '1.02rem',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        lineHeight: 1.25,
                        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      {dest.city}
                      {isSelected && <Check style={{ color: '#F43F5E', fontSize: '1.1rem' }} />}
                    </div>
                    <div
                      style={{
                        fontSize: '0.74rem',
                        color: 'rgba(255, 255, 255, 0.85)',
                        marginTop: '2px',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {dest.subtitle}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          ĐƯỜNG KẺ NGANG (DIVIDER) TINH TẾ
          ───────────────────────────────────────────────────────────────── */}
      <div
        style={{
          margin: '2.5rem 0 2rem',
          borderTop: '1px solid var(--color-border-subtle, #E2E8F0)',
        }}
      />

      {/* ─────────────────────────────────────────────────────────────────
          KHU VỰC 3: 🏠 Bộ sưu tập chỗ ở toàn quốc (Khám phá chỗ ở với phân trang)
          ───────────────────────────────────────────────────────────────── */}
      <section id="stays-section" ref={staysSectionRef} style={{ scrollMarginTop: '5rem' }}>
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <h2
              className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight m-0"
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--color-text-primary, #0F172A)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>🏠 Bộ sưu tập chỗ ở toàn quốc</span>
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary, #475569)',
                margin: '0.35rem 0 0',
              }}
            >
              {selectedCity
                ? `Hiển thị các chỗ nghỉ tại ${selectedCity}`
                : `Hơn ${properties.length} chỗ nghỉ cao cấp đa dạng từ homestay, căn hộ dịch vụ đến villa biển`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {selectedCity && (
              <button
                type="button"
                onClick={() => setSelectedCity(null)}
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--color-primary, #E11D48)',
                  background: 'var(--color-primary-soft, #FFF1F2)',
                  border: '1px solid #FECDD3',
                  borderRadius: '9999px',
                  padding: '0.35rem 0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <XCircle style={{ fontSize: '0.9rem' }} /> Bỏ lọc ({selectedCity})
              </button>
            )}

            <Link
              to="/rooms"
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--color-primary, #FF385C)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '9999px',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary-soft, #FFF1F2)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span>Xem thêm</span>
              <ChevronRight style={{ fontSize: '0.8rem' }} />
            </Link>
          </div>
        </div>

        {/* Grid hiển thị chính xác 2 hàng (10 đơn), tỷ lệ hiển thị đầy đủ mọi nội dung không bị cắt */}
        <div className="explore-property-grid">
          {paginatedExploreProperties.map(property => (
            <PropertyCard
              key={property.id}
              property={property}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              nights={2}
              aspectRatio="16 / 10"
            />
          ))}
        </div>

        {paginatedExploreProperties.length === 0 && (
          <div
            style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              color: 'var(--color-text-secondary, #64748B)',
              background: '#F8FAFC',
              borderRadius: '16px',
              border: '1px dashed var(--color-border-strong, #CBD5E1)',
              margin: '1.5rem 0',
            }}
          >
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
              Chưa có chỗ nghỉ nào tại {selectedCity}
            </p>
            <button
              type="button"
              onClick={() => setSelectedCity(null)}
              style={{
                marginTop: '0.75rem',
                background: 'var(--color-primary, #E11D48)',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
              }}
            >
              Xem tất cả chỗ nghỉ
            </button>
          </div>
        )}

        {/* Thanh số trang chuyển trang bên dưới */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '2.5rem',
            }}
          >
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              style={{
                padding: '0.5rem 0.95rem',
                borderRadius: '10px',
                border: '1px solid var(--color-border-strong, #CBD5E1)',
                background: '#FFFFFF',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.45 : 1,
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--color-text-primary, #0F172A)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
              }}
            >
              <ChevronLeft style={{ fontSize: '0.8rem' }} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                type="button"
                onClick={() => {
                  setCurrentPage(page);
                  if (staysSectionRef.current) {
                    staysSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                style={{
                  minWidth: 38,
                  height: 38,
                  padding: '0 8px',
                  borderRadius: '10px',
                  border: page === currentPage ? 'none' : '1px solid var(--color-border-subtle, #E2E8F0)',
                  background: page === currentPage ? 'var(--color-primary, #E11D48)' : '#FFFFFF',
                  color: page === currentPage ? '#FFFFFF' : 'var(--color-text-primary, #0F172A)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: page === currentPage ? '0 2px 8px rgba(225, 29, 72, 0.3)' : 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
                  transition: 'all 0.15s ease',
                }}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              style={{
                padding: '0.5rem 0.95rem',
                borderRadius: '10px',
                border: '1px solid var(--color-border-strong, #CBD5E1)',
                background: '#FFFFFF',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.45 : 1,
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--color-text-primary, #0F172A)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
              }}
            >
            <ChevronRight style={{ fontSize: '0.8rem' }} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
