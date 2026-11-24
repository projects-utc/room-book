import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { stayApi } from '../../api/stayApi';
import { Breadcrumb, Button, Card, EmptyState, StatCard, formatDisplayDateVN } from '../../components';
import { formatVND, BADGE_CLASS, BADGE_LABEL } from '../../constants';
import {
  ArrowLeftRight, ArrowRight, Calendar3, CalendarCheck,
  Check2All, CheckLg, ChevronLeft, ChevronRight, Eye, Search, X, XCircle,
  KeyFill, ArrowCounterclockwise,
} from 'react-bootstrap-icons';
import type { Booking } from '../../data';
import {
  DEFAULT_BOOKING_FILTERS, STATUS_FILTERS, filterBookings, readBookingFilters,
} from './bookingFilters';
import type { BookingFilters } from './bookingFilters';
import { BOOKING_PAGE_SIZES, DEFAULT_BOOKING_PAGE_SIZE, paginateBookings } from './bookingPagination';
import './HostBookingsPage.css';

export default function HostBookingsPage() {
  const { store, addToast } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readBookingFilters(searchParams);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError('');

    const fetchBookings = async () => {
      try {
        const response = await stayApi.getBookings();
        if (!active) return;
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(response.message || 'Không tải được danh sách đơn từ máy chủ');
        }
        store.setBookings(response.data);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Lỗi khi tải danh sách đơn từ máy chủ';
        setLoadError(message);
        addToast(message, 'error');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void fetchBookings();
    return () => { active = false; };
  }, [store, addToast, reloadVersion]);

  // StoreContext rerenders when the API response is saved to the shared cache.
  const bookings = isLoading || loadError ? [] : store.getAllBookings();
  const { filteredBookings, statusCounts, invalidDateRange } = filterBookings(bookings, filters);
  const { page, pageSize, pageCount, pages, visibleBookings } =
    paginateBookings(filteredBookings, searchParams);

  const updateFilters = (patch: Partial<BookingFilters>) => {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous);
      next.delete('page');
      Object.entries(patch).forEach(([key, value]) => {
        if (!value || (key === 'status' && value === 'ALL')) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      return next;
    }, { replace: true });
  };

  const updatePagination = (nextPage: number, nextPageSize: number = pageSize) => {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous);
      if (nextPage === 1) next.delete('page');
      else next.set('page', String(nextPage));
      if (nextPageSize === DEFAULT_BOOKING_PAGE_SIZE) next.delete('pageSize');
      else next.set('pageSize', String(nextPageSize));
      return next;
    }, { replace: true });
  };

  const clearFilters = () => updateFilters(DEFAULT_BOOKING_FILTERS);
  const hasActiveFilters = Boolean(filters.q.trim() || filters.from || filters.to || filters.status !== 'ALL');

  const handleUpdateStatus = async (code: string, newStatus: Booking['status']) => {
    if (updatingCode) return;
    setUpdatingCode(code);

    try {
      const response = await stayApi.updateBookingStatus(code, newStatus);
      if (!response.success) {
        addToast(response.message || 'Lỗi khi cập nhật trạng thái từ máy chủ', 'error');
        return;
      }

      const updatedStatus = response.data?.status || newStatus;
      store.setBookings(store.getAllBookings().map(booking => booking.code === code
        ? { ...booking, ...response.data, status: updatedStatus }
        : booking));
      addToast(`Đơn #${code}: ${BADGE_LABEL[updatedStatus]}`, 'success');
    } catch {
      addToast('Không thể kết nối đến máy chủ để đổi trạng thái', 'error');
    } finally {
      setUpdatingCode(null);
    }
  };

  return (
    <div className="host-bookings">
      <Breadcrumb items={[
        { label: 'Host Portal', to: '/host/properties' },
        { label: 'Quản lý đơn đặt phòng' },
      ]} />

      <div className="booking-page-heading">
        <h1>Quản lý &amp; Xử lý đơn đặt phòng</h1>
      </div>

      <div className="booking-stats">
        <StatCard size="sm" label="Yêu cầu chờ phê duyệt"
          value={`${bookings.filter(b => b.status === 'PENDING').length} đơn`}
          sublabel="Cần phản hồi trong 24h" accent="warn" />
        <StatCard size="sm" label="Đơn đã xác nhận"
          value={`${bookings.filter(b => b.status === 'CONFIRMED').length} đơn`}
          sublabel="Chờ đón khách nhận phòng" accent="brand" />
        <StatCard size="sm" label="Đơn lưu trú hoàn tất"
          value={`${bookings.filter(b => b.status === 'COMPLETED').length} đơn`}
          sublabel="Các kỳ lưu trú đã kết thúc" accent="ok" />
      </div>

      <Card padding="none" className="booking-panel" style={{ padding: 0 }}>
        <div className="booking-panel-heading">
          <div className="booking-heading-icon"><CalendarCheck aria-hidden="true" /></div>
          <div>
            <h2 id="bookings-heading">Danh sách đơn đặt phòng</h2>
          </div>
        </div>

        <section className="booking-filters" aria-label="Bộ lọc đơn đặt phòng">
          <div className="booking-filter-grid">
            <div className="booking-search" role="search" aria-label="Tìm đơn đặt phòng">
              <Search aria-hidden="true" />
              <input id="booking-search" type="search" className="booking-filter-control"
                aria-label="Tìm theo mã đơn, tên khách, số điện thoại, email, chỗ ở hoặc phòng"
                placeholder="Tìm mã đơn, tên khách, số điện thoại"
                value={filters.q} onChange={event => updateFilters({ q: event.target.value })}
                autoComplete="off" spellCheck={false} />
              {filters.q && <button type="button" className="booking-search-clear"
                aria-label="Xóa từ khóa tìm kiếm" onClick={() => updateFilters({ q: '' })}>
                <X aria-hidden="true" />
              </button>}
            </div>
            <div className="booking-field">
              <label htmlFor="booking-from"><Calendar3 aria-hidden="true" /> Lưu trú từ ngày</label>
              <input id="booking-from" type="date" className="booking-filter-control"
                value={filters.from} max={filters.to || undefined} aria-invalid={invalidDateRange}
                aria-describedby={invalidDateRange ? 'booking-date-help' : undefined}
                onChange={event => updateFilters({ from: event.target.value })} />
            </div>
            <div className="booking-field">
              <label htmlFor="booking-to"><Calendar3 aria-hidden="true" /> Đến ngày</label>
              <input id="booking-to" type="date" className="booking-filter-control"
                value={filters.to} min={filters.from || undefined} aria-invalid={invalidDateRange}
                aria-describedby={invalidDateRange ? 'booking-date-help' : undefined}
                onChange={event => updateFilters({ to: event.target.value })} />
            </div>
            <button type="button" className="booking-reset" onClick={clearFilters}
              disabled={!hasActiveFilters}>
              <ArrowCounterclockwise aria-hidden="true" /> Xóa bộ lọc
            </button>
          </div>

          {invalidDateRange && <p id="booking-date-help" className="booking-filter-help is-error" role="alert">
            Ngày kết thúc cần bằng hoặc sau ngày bắt đầu.
          </p>}
        </section>

        <div className="booking-toolbar">
          <div className="booking-status-tabs" role="group" aria-label="Lọc theo trạng thái đơn">
            {STATUS_FILTERS.map(tab => <button key={tab.id} type="button"
              className={`booking-status-tab${filters.status === tab.id ? ' is-active' : ''}`}
              aria-pressed={filters.status === tab.id} onClick={() => updateFilters({ status: tab.id })}>
              {tab.label}<span>{statusCounts[tab.id]}</span>
            </button>)}
          </div>
          <div className="booking-page-size">
            <label htmlFor="booking-page-size">Hiển thị</label>
            <select id="booking-page-size" value={pageSize}
              aria-label="Số bản ghi mỗi trang"
              onChange={event => updatePagination(1, Number(event.target.value))}>
              {BOOKING_PAGE_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
            </select>
            <span>/ trang</span>
          </div>
        </div>

        {isLoading ? (
          <div className="booking-empty" role="status">
            <EmptyState compact icon={<ArrowCounterclockwise />}
              title="Đang tải danh sách đơn đặt phòng…" />
          </div>
        ) : loadError ? (
          <div className="booking-empty" role="alert">
            <EmptyState compact title="Không tải được danh sách đơn"
              description={loadError}
              action={<Button variant="outline" size="sm" icon={<ArrowCounterclockwise />}
                onClick={() => setReloadVersion(version => version + 1)}>Thử lại</Button>} />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="booking-empty">
            <EmptyState icon={bookings.length ? <Search /> : <CalendarCheck />}
              title={invalidDateRange ? 'Kiểm tra lại khoảng ngày' : bookings.length
                ? 'Không tìm thấy đơn phù hợp' : 'Chưa có đơn đặt phòng'}
              description={invalidDateRange ? 'Chọn lại khoảng thời gian lưu trú hợp lệ để xem kết quả.' : bookings.length
                ? 'Thử từ khóa khác, mở rộng khoảng ngày hoặc bỏ bớt bộ lọc.'
                : 'Các yêu cầu đặt phòng mới sẽ xuất hiện tại đây.'}
              action={hasActiveFilters ? <Button variant="outline" size="sm"
                icon={<ArrowCounterclockwise />} onClick={clearFilters}>Xóa tất cả bộ lọc</Button> : undefined} />
          </div>
        ) : (
          <>
            <p className="booking-scroll-hint"><ArrowLeftRight aria-hidden="true" /> Vuốt ngang để xem đầy đủ thông tin</p>
            <div className="table-responsive booking-table-wrapper" role="region"
              aria-labelledby="bookings-heading" tabIndex={0}>
              <table id="host-bookings-table" className="table booking-table">
                <thead>
                  <tr>
                    <th scope="col">Mã đơn</th>
                    <th scope="col">Ngày tạo</th>
                    <th scope="col">Khách đặt</th>
                    <th scope="col">Hạng phòng &amp; Chỗ ở</th>
                    <th scope="col">Thời gian lưu trú</th>
                    <th scope="col">Tổng tiền</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col" className="booking-actions-heading">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleBookings.map(booking => (
                    <tr key={booking.code} aria-busy={updatingCode === booking.code}>
                      <td><Link className="booking-code" to={`/host/bookings/${encodeURIComponent(booking.code)}`}>
                        #{booking.code}
                      </Link></td>
                      <td className="booking-created-at">{booking.createdAt ? formatDisplayDateVN(booking.createdAt) : '—'}</td>
                      <td><strong className="booking-cell-title">{booking.guestName}</strong>
                        <span className="booking-cell-subtitle">{booking.guestPhone}</span></td>
                      <td><strong className="booking-cell-title">{booking.roomName}</strong>
                        <span className="booking-cell-subtitle">{booking.propertyName}</span></td>
                      <td><div className="booking-stay-dates">
                        <span>{formatDisplayDateVN(booking.checkIn)}</span><ArrowRight aria-label="đến" />
                        <span>{formatDisplayDateVN(booking.checkOut)}</span>
                      </div><span className="booking-cell-subtitle">{booking.nights} đêm · {booking.guests} khách</span></td>
                      <td className="booking-total">{formatVND(booking.total)}</td>
                      <td><span className={`badge ${BADGE_CLASS[booking.status] || 'badge-pending'}`}>
                        {BADGE_LABEL[booking.status] || booking.status}
                      </span></td>
                      <td><div className="booking-actions">
                        {booking.status === 'PENDING' && <>
                          <Button variant="primary" size="xs" icon={<CheckLg />}
                            disabled={updatingCode !== null}
                            onClick={() => handleUpdateStatus(booking.code, 'CONFIRMED')}>Duyệt đơn</Button>
                          <Button variant="outline" size="xs" icon={<XCircle />}
                            disabled={updatingCode !== null}
                            onClick={() => handleUpdateStatus(booking.code, 'REJECTED')}>Từ chối</Button>
                        </>}
                        {booking.status === 'CONFIRMED' && <Button variant="outline" size="xs" icon={<KeyFill />}
                          disabled={updatingCode !== null}
                          onClick={() => handleUpdateStatus(booking.code, 'CHECKED_IN')}>Check-in</Button>}
                        {booking.status === 'CHECKED_IN' && <Button variant="primary" size="xs" icon={<Check2All />}
                          disabled={updatingCode !== null}
                          onClick={() => handleUpdateStatus(booking.code, 'COMPLETED')}>Hoàn tất</Button>}
                        <Link className="btn btn-outline btn-xs" to={`/host/bookings/${encodeURIComponent(booking.code)}`}>
                          <Eye aria-hidden="true" /> Chi tiết
                        </Link>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {pageCount > 1 && <nav className="booking-pagination" aria-label="Phân trang đơn đặt phòng">
          <button type="button" className="booking-page-button" aria-label="Trang trước"
            aria-controls="host-bookings-table" disabled={page === 1}
            onClick={() => updatePagination(page - 1)}>
            <ChevronLeft aria-hidden="true" /> Trước
          </button>
          {pages.map(item => typeof item === 'number' ? (
            <button key={item} type="button"
              className={`booking-page-button${item === page ? ' is-active' : ''}`}
              aria-label={`Trang ${item}`} aria-current={item === page ? 'page' : undefined}
              aria-controls="host-bookings-table" onClick={() => updatePagination(item)}>
              {item}
            </button>
          ) : <span key={item} className="booking-page-ellipsis" aria-hidden="true">…</span>)}
          <button type="button" className="booking-page-button" aria-label="Trang sau"
            aria-controls="host-bookings-table" disabled={page === pageCount}
            onClick={() => updatePagination(page + 1)}>
            Sau <ChevronRight aria-hidden="true" />
          </button>
        </nav>}
      </Card>
    </div>
  );
}
