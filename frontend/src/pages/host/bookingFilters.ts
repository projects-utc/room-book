import type { Booking } from '../../data';

export type BookingStatusFilter = 'ALL' | Booking['status'];

export const STATUS_FILTERS: { id: BookingStatusFilter; label: string }[] = [
  { id: 'ALL', label: 'Tất cả đơn' },
  { id: 'PENDING', label: 'Chờ duyệt' },
  { id: 'CONFIRMED', label: 'Đã xác nhận' },
  { id: 'CHECKED_IN', label: 'Đang lưu trú' },
  { id: 'COMPLETED', label: 'Hoàn tất' },
  { id: 'CANCELLED', label: 'Đã hủy' },
  { id: 'REJECTED', label: 'Đã từ chối' },
];

export interface BookingFilters {
  q: string;
  from: string;
  to: string;
  status: BookingStatusFilter;
}

export const DEFAULT_BOOKING_FILTERS: BookingFilters = {
  q: '', from: '', to: '', status: 'ALL',
};

const BOOKING_SORT_BY_STATUS: Record<BookingStatusFilter, {
  field: 'createdAt' | 'checkIn' | 'checkOut';
  direction: 1 | -1;
}> = {
  ALL: { field: 'createdAt', direction: -1 },
  PENDING: { field: 'createdAt', direction: -1 },
  CONFIRMED: { field: 'checkIn', direction: 1 },
  CHECKED_IN: { field: 'checkOut', direction: 1 },
  COMPLETED: { field: 'checkOut', direction: -1 },
  CANCELLED: { field: 'createdAt', direction: -1 },
  REJECTED: { field: 'createdAt', direction: -1 },
};

function readDate(value: string | null): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : '';
}

export function readBookingFilters(params: URLSearchParams): BookingFilters {
  return {
    q: params.get('q') || '',
    from: readDate(params.get('from')),
    to: readDate(params.get('to')),
    status: STATUS_FILTERS.find(option => option.id === params.get('status'))?.id || 'ALL',
  };
}

function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/đ/g, 'd').replace(/#/g, '').trim();
}

export function filterBookings(bookings: Booking[], filters: BookingFilters) {
  const terms = normalizeSearch(filters.q).split(/\s+/).filter(Boolean);
  const invalidDateRange = Boolean(filters.from && filters.to && filters.from > filters.to);

  const matchingBookings = bookings.filter(booking => {
    if (invalidDateRange) return false;

    // A stay occupies [checkIn, checkOut); the selected end day is inclusive.
    if (filters.from && (!booking.checkOut || booking.checkOut <= filters.from)) return false;
    if (filters.to && (!booking.checkIn || booking.checkIn > filters.to)) return false;

    const searchableText = normalizeSearch([
      booking.code, booking.guestName, booking.guestUsername, booking.guestPhone,
      booking.guestPhone?.replace(/\D/g, ''), booking.guestEmail,
      booking.propertyName, booking.roomName,
    ].filter(Boolean).join(' '));
    return terms.every(term => searchableText.includes(term));
  });

  // Counts include the other filters so switching status has a predictable result.
  const statusCounts: Record<BookingStatusFilter, number> = {
    ALL: matchingBookings.length,
    PENDING: 0, CONFIRMED: 0, CHECKED_IN: 0, COMPLETED: 0, CANCELLED: 0, REJECTED: 0,
  };
  matchingBookings.forEach(booking => {
    if (Object.prototype.hasOwnProperty.call(statusCounts, booking.status)) statusCounts[booking.status] += 1;
  });

  const filteredBookings = matchingBookings.filter(booking =>
    filters.status === 'ALL' || booking.status === filters.status,
  );
  const { field, direction } = BOOKING_SORT_BY_STATUS[filters.status];
  filteredBookings.sort((a, b) => {
    if (b.id && a.id && b.id !== a.id) return Number(b.id) - Number(a.id);
    const primary = direction * (a[field] || '').localeCompare(b[field] || '');
    if (primary !== 0) return primary;
    const aIsDemo = (a.code || '').includes('DEMO');
    const bIsDemo = (b.code || '').includes('DEMO');
    if (aIsDemo !== bIsDemo) return aIsDemo ? 1 : -1;
    return (b.code || '').localeCompare(a.code || '');
  });

  return { filteredBookings, statusCounts, invalidDateRange };
}
