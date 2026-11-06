import { Property, Room, RoomBlock, Booking, Review, Promotion, AuditLog, User } from '../data';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface HostRevenueRow {
  hostId: number;
  roomId: number;
  roomName: string;
  revenueMonth: string;
  totalBookings: number;
  totalRevenue: number;
}

const TOKEN_KEY = 'odd_jwt_token';

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(url, { ...options, headers });
    const json = await res.json().catch(() => ({ success: false, message: 'Lỗi parse JSON' }));
    if (!res.ok) {
      return {
        success: false,
        message: json.message || `Lỗi HTTP ${res.status}`,
        data: (json.data || json) as T,
      };
    }
    return {
      success: true,
      message: json.message || 'Thành công',
      data: (json.data !== undefined ? json.data : json) as T,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ backend';
    console.error(`[stayApi] Request to ${url} failed:`, err);
    return {
      success: false,
      message: msg,
      data: null as unknown as T,
    };
  }
}

export const stayApi = {
  // 1. Properties
  async getProperties() {
    return fetchJson<Property[]>('/api/properties');
  },

  async getProperty(id: number | string) {
    return fetchJson<Property>(`/api/properties/${id}`);
  },

  async createProperty(property: Partial<Property>) {
    return fetchJson<Property>('/api/properties', {
      method: 'POST',
      body: JSON.stringify(property),
    });
  },

  async deleteProperty(id: number | string) {
    return fetchJson<void>(`/api/properties/${id}`, { method: 'DELETE' });
  },

  async togglePropertyStatus(id: number | string) {
    return fetchJson<Property>(`/api/properties/${id}/toggle-status`, { method: 'PATCH' });
  },

  // 2. Rooms
  async getRooms(propertyId?: number | string) {
    const qs = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : '';
    return fetchJson<Room[]>(`/api/rooms${qs}`);
  },

  async createRoom(room: Partial<Room>) {
    return fetchJson<Room>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(room),
    });
  },

  async deleteRoom(id: number | string) {
    return fetchJson<void>(`/api/rooms/${id}`, { method: 'DELETE' });
  },

  // 3. Room blocks
  async getRoomBlocks(roomId?: number | string) {
    const qs = roomId ? `?roomId=${encodeURIComponent(roomId)}` : '';
    return fetchJson<RoomBlock[]>(`/api/room-blocks${qs}`);
  },

  async createRoomBlock(block: Partial<RoomBlock>) {
    return fetchJson<RoomBlock>('/api/room-blocks', {
      method: 'POST',
      body: JSON.stringify(block),
    });
  },

  async deleteRoomBlock(id: number | string) {
    return fetchJson<void>(`/api/room-blocks/${id}`, { method: 'DELETE' });
  },

  // 4. Bookings
  async getBookings(guestUsername?: string) {
    const qs = guestUsername ? `?guestUsername=${encodeURIComponent(guestUsername)}` : '';
    return fetchJson<Booking[]>(`/api/bookings${qs}`);
  },

  async getAdminBookings() {
    return fetchJson<Booking[]>('/api/admin/bookings');
  },

  async getBooking(code: string) {
    return fetchJson<Booking>(`/api/bookings/${encodeURIComponent(code)}`);
  },

  async createBooking(booking: Partial<Booking>) {
    return fetchJson<Booking>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  },

  async updateBookingStatus(code: string, status: string) {
    return fetchJson<Booking>(`/api/bookings/${encodeURIComponent(code)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async cancelBooking(code: string) {
    return fetchJson<Booking>(`/api/bookings/${encodeURIComponent(code)}/cancel`, {
      method: 'POST',
    });
  },

  async adminCancelBooking(code: string, reason: string) {
    return fetchJson<Booking>(`/api/admin/bookings/${encodeURIComponent(code)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async adminUpdateBookingStatus(code: string, status: string, reason?: string) {
    return fetchJson<Booking>(`/api/admin/bookings/${encodeURIComponent(code)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  },

  async getHostRevenue() {
    return fetchJson<HostRevenueRow[]>('/api/host/revenue');
  },

  async getAdminRevenue() {
    return fetchJson<HostRevenueRow[]>('/api/admin/revenue');
  },

  // 6. Reviews
  // 5. Reviews
  async getReviews(propertyId?: number | string) {
    const qs = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : '';
    return fetchJson<Review[]>(`/api/reviews${qs}`);
  },

  async submitReview(review: Partial<Review>) {
    return fetchJson<Review>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(review),
    });
  },

  // 6. Promotions
  async getPromotions() {
    return fetchJson<Promotion[]>('/api/promotions');
  },

  async createPromotion(promo: Partial<Promotion>) {
    return fetchJson<Promotion>('/api/promotions', {
      method: 'POST',
      body: JSON.stringify(promo),
    });
  },

  async togglePromotion(id: number | string) {
    return fetchJson<Promotion>(`/api/promotions/${id}/toggle`, { method: 'PATCH' });
  },

  async deletePromotion(id: number | string) {
    return fetchJson<void>(`/api/promotions/${id}`, { method: 'DELETE' });
  },

  // 7. Users
  async getUsers() {
    return fetchJson<User[]>('/api/users');
  },

  async createUser(user: Partial<User> & { password?: string }) {
    return fetchJson<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },

  async toggleUserStatus(id: number | string) {
    return fetchJson<User>(`/api/users/${id}/toggle-status`, { method: 'PATCH' });
  },

  async changeUserRole(id: number | string, role: string) {
    return fetchJson<User>(`/api/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  // 8. Audit logs
  async getAuditLogs() {
    return fetchJson<AuditLog[]>('/api/audit-logs');
  },

  async createAuditLog(logEntity: Partial<AuditLog>) {
    return fetchJson<AuditLog>('/api/audit-logs', {
      method: 'POST',
      body: JSON.stringify(logEntity),
    });
  },
};

export default stayApi;
