export const BOOKING_PAGE_SIZES = [5, 10, 20, 50] as const;
export const DEFAULT_BOOKING_PAGE_SIZE = 10;

type PageItem = number | 'start-ellipsis' | 'end-ellipsis';

export function paginateBookings<T>(bookings: T[], params: URLSearchParams) {
  const requestedSize = Number(params.get('pageSize'));
  const pageSize = BOOKING_PAGE_SIZES.find(size => size === requestedSize) ?? DEFAULT_BOOKING_PAGE_SIZE;
  const totalRecords = bookings.length;
  const pageCount = Math.max(1, Math.ceil(totalRecords / pageSize));
  const requestedPage = Number(params.get('page'));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, pageCount) : 1;
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);

  let pages: PageItem[];
  if (pageCount <= 7) {
    pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  } else if (page <= 4) {
    pages = [1, 2, 3, 4, 5, 'end-ellipsis', pageCount];
  } else if (page >= pageCount - 3) {
    pages = [1, 'start-ellipsis', pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  } else {
    pages = [1, 'start-ellipsis', page - 1, page, page + 1, 'end-ellipsis', pageCount];
  }

  return {
    page, pageSize, pageCount, pages, totalRecords,
    firstRecord: totalRecords ? startIndex + 1 : 0,
    lastRecord: endIndex,
    visibleBookings: bookings.slice(startIndex, endIndex),
  };
}
