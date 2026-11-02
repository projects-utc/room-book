// ODauDay Stay — ODDStore: Client-side Business Logic Engine (TypeScript)
import { STORAGE_KEY, USER_KEY, formatVND } from './constants';
import { INITIAL_DATA, InitialDataState, User, Property, Room, RoomBlock, Booking, Review } from './data';

function loadData(): InitialDataState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveData(INITIAL_DATA);
      return JSON.parse(JSON.stringify(INITIAL_DATA));
    }
    return JSON.parse(raw);
  } catch {
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
}

function saveData(data: InitialDataState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Cannot save data to LocalStorage:', e);
  }
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw || raw === 'LOGGED_OUT' || raw === 'null') return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  try {
    if (!user) localStorage.setItem(USER_KEY, 'LOGGED_OUT');
    else localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export interface QuoteResult {
  success: boolean;
  code?: string;
  message?: string;
  property?: Property;
  room?: Room;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  guests?: number;
  pricePerNight?: number;
  subtotal?: number;
  serviceFee?: number;
  total?: number;
  conflictDetails?: {
    hasConflict: boolean;
    type?: string;
    reason?: string;
  };
}

export const ODDStore = {
  getData: () => loadData(),

  reset(): InitialDataState {
    saveData(INITIAL_DATA);
    setCurrentUser(null);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  },

  getCurrentUser,
  setCurrentUser,
  formatVND,

  // UC-01: Login / BR-02
  login(username: string, password?: string): { success: boolean; code?: string; message?: string; user?: User } {
    const data = loadData();
    const inputName = (username || '').trim().toLowerCase();
    const user = data.users.find(u => {
      const uname = u.username.toLowerCase();
      return (
        uname === inputName ||
        ((uname === 'admin' || uname === 'admin.demo') && (inputName === 'admin' || inputName === 'admin.demo'))
      );
    });

    if (!user) return { success: false, code: 'NOT_FOUND', message: 'Tài khoản không tồn tại trên hệ thống.' };
    if (user.status === 'LOCKED') return { success: false, code: 'LOCKED', message: 'Tài khoản này đang bị khóa bởi Quản trị viên.' };
    if (password && password !== '********' && user.password !== password) {
      return { success: false, code: 'WRONG_PASSWORD', message: 'Mật khẩu không chính xác (TC-02).' };
    }

    const sessionUser: User = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      status: user.status,
      email: user.email,
    };
    setCurrentUser(sessionUser);
    return { success: true, user: sessionUser };
  },

  register(newUser: Partial<User>): { success: boolean; message?: string; user?: User } {
    const data = loadData();
    const exists = data.users.find(u => u.username.toLowerCase() === (newUser.username || '').trim().toLowerCase());
    if (exists) return { success: false, message: 'Tên đăng nhập đã tồn tại, vui lòng chọn tên khác!' };

    const created: User = {
      id: data.users.length + 1,
      username: (newUser.username || '').trim(),
      password: newUser.password || '123',
      fullName: newUser.fullName || '',
      phone: newUser.phone || '',
      email: newUser.email || '',
      role: newUser.role || 'GUEST',
      status: 'ACTIVE',
    };
    data.users.push(created);
    saveData(data);
    return { success: true, user: created };
  },

  logout(): void {
    setCurrentUser(null);
  },

  // UC-02: Search / BR-03 / TC-03
  search(criteria: { checkIn?: string; checkOut?: string; kw?: string; type?: string; maxPrice?: number | string }) {
    const { checkIn, checkOut, kw = '', type = 'Tất cả', maxPrice } = criteria;
    if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
      return {
        success: false,
        code: 'INVALID_DATES',
        message: 'Lỗi quy tắc ngày (TC-03): Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm!',
        count: 0,
        properties: [] as Property[],
      };
    }
    const data = loadData();
    const kwLower = kw.toLowerCase().trim();
    const maxP = typeof maxPrice === 'number' ? maxPrice : parseInt(String(maxPrice || ''), 10) || Infinity;
    const results = data.properties.filter(p => {
      const matchKw =
        !kwLower ||
        p.name.toLowerCase().includes(kwLower) ||
        p.address.toLowerCase().includes(kwLower) ||
        p.city.toLowerCase().includes(kwLower) ||
        (p.area || '').toLowerCase().includes(kwLower);
      const matchType = type === 'Tất cả' || type === 'Tất cả chỗ ở' || p.type.toLowerCase().includes(type.toLowerCase());
      return matchKw && matchType && p.priceMin <= maxP;
    });

    if (results.length === 0) return { success: false, code: 'EMPTY', count: 0, properties: [] };
    return { success: true, count: results.length, properties: results };
  },

  getProperty(id: number | string): Property | null {
    const data = loadData();
    return data.properties.find(p => p.id === parseInt(String(id), 10)) || null;
  },

  getRoomsByProperty(propertyId: number | string): Room[] {
    const data = loadData();
    return data.rooms.filter(r => r.propertyId === parseInt(String(propertyId), 10));
  },

  // UC-03: Quote / BR-04 / BR-05 / BR-06
  calculateQuote(roomId: number | string, checkInStr?: string, checkOutStr?: string, guestsCount?: number | string): QuoteResult {
    const data = loadData();
    const room = data.rooms.find(r => r.id === parseInt(String(roomId), 10)) || data.rooms[0];
    const property = data.properties.find(p => p.id === room.propertyId) || data.properties[0];

    if (!checkInStr || !checkOutStr) {
      checkInStr = '2027-01-10';
      checkOutStr = '2027-01-12';
    }
    const dIn = new Date(checkInStr);
    const dOut = new Date(checkOutStr);

    if (dOut <= dIn) {
      return { success: false, code: 'INVALID_DATES', message: 'Ngày trả phòng phải sau ngày nhận phòng!' };
    }
    const nights = Math.max(1, Math.round((dOut.getTime() - dIn.getTime()) / (1000 * 60 * 60 * 24)));
    const guests = parseInt(String(guestsCount || 2), 10);

    if (guests > room.capacity) {
      return {
        success: false,
        code: 'CAPACITY_EXCEEDED',
        message: `Lỗi sức chứa (BR-06 / TC-06): ${room.name} chỉ phục vụ tối đa ${room.capacity} khách (bạn chọn ${guests} khách).`,
      };
    }

    const conflict = this.checkConflict(room.id, checkInStr, checkOutStr);
    if (conflict.hasConflict) {
      return {
        success: false,
        code: 'ROOM_CONFLICT',
        message: `Lỗi trùng phòng (BR-04 / TC-05): ${conflict.reason}`,
        conflictDetails: conflict,
      };
    }

    const subtotal = room.price * nights;
    return {
      success: true,
      property,
      room,
      checkIn: checkInStr,
      checkOut: checkOutStr,
      nights,
      guests,
      pricePerNight: room.price,
      subtotal,
      serviceFee: 0,
      total: subtotal,
    };
  },

  checkConflict(roomId: number | string, checkInStr: string, checkOutStr: string, excludeBookingCode?: string) {
    const data = loadData();
    const rId = parseInt(String(roomId), 10);
    const newIn = new Date(checkInStr);
    const newOut = new Date(checkOutStr);

    const block = data.roomBlocks.find(b => {
      if (b.roomId !== rId) return false;
      const bIn = new Date(b.start);
      const bOut = new Date(b.end);
      return !(newOut <= bIn || newIn >= bOut);
    });
    if (block) {
      return {
        hasConflict: true,
        type: 'BLOCK',
        reason: `Phòng đang có lịch bảo trì từ ${block.start} đến ${block.end} (${block.reason})`,
      };
    }

    const activeBooking = data.bookings.find(b => {
      if (b.roomId !== rId) return false;
      if (excludeBookingCode && b.code === excludeBookingCode) return false;
      if (!['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(b.status)) return false;
      const bIn = new Date(b.checkIn);
      const bOut = new Date(b.checkOut);
      return !(newOut <= bIn || newIn >= bOut);
    });
    if (activeBooking) {
      return {
        hasConflict: true,
        type: 'BOOKING',
        reason: `Khoảng ngày này đã có khách đặt trước (Đơn: ${activeBooking.code}, trạng thái: ${activeBooking.status})`,
      };
    }

    return { hasConflict: false };
  },

  createBooking(payload: {
    roomId: number | string;
    checkIn: string;
    checkOut: string;
    guests: number | string;
    guestName?: string;
    guestPhone?: string;
    guestEmail?: string;
  }): { success: boolean; booking?: Booking; message?: string } {
    const quote = this.calculateQuote(payload.roomId, payload.checkIn, payload.checkOut, payload.guests);
    if (!quote.success) return { success: false, message: quote.message };

    const data = loadData();
    const currentUser = getCurrentUser();
    const code = 'ODD-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));

    const newBooking: Booking = {
      code,
      guestUsername: currentUser?.username || 'guest.demo',
      guestName: payload.guestName || currentUser?.fullName || 'Khách thuê Demo',
      guestPhone: payload.guestPhone || '0900000003',
      guestEmail: payload.guestEmail || 'guest@odauday.vn',
      propertyId: quote.property!.id,
      propertyName: quote.property!.name,
      roomId: quote.room!.id,
      roomName: quote.room!.name,
      checkIn: quote.checkIn!,
      checkOut: quote.checkOut!,
      nights: quote.nights!,
      guests: quote.guests!,
      pricePerNight: quote.pricePerNight!,
      subtotal: quote.subtotal!,
      serviceFee: quote.serviceFee!,
      total: quote.total!,
      status: 'PENDING',
      createdAt: new Date().toISOString().slice(0, 10),
      isReviewed: false,
    };

    data.bookings.push(newBooking);
    saveData(data);
    return { success: true, booking: newBooking };
  },

  // UC-04: My Bookings
  getMyBookings(username: string): Booking[] {
    const data = loadData();
    return data.bookings.filter(b => b.guestUsername === username).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getBooking(code: string): Booking | null {
    const data = loadData();
    return data.bookings.find(b => b.code === code) || null;
  },

  cancelBooking(code: string): { success: boolean; message?: string } {
    const data = loadData();
    const idx = data.bookings.findIndex(b => b.code === code);
    if (idx === -1) return { success: false, message: 'Không tìm thấy đơn đặt phòng.' };
    const b = data.bookings[idx];
    if (!['PENDING', 'CONFIRMED'].includes(b.status)) {
      return { success: false, message: 'Chỉ có thể hủy đơn ở trạng thái PENDING hoặc CONFIRMED.' };
    }
    data.bookings[idx].status = 'CANCELLED';
    saveData(data);
    return { success: true };
  },

  // UC-05: Reviews
  submitReview(reviewPayload: {
    bookingCode: string;
    propertyId: number;
    guestUsername: string;
    guestName: string;
    rating: number;
    comment: string;
  }): { success: boolean; message?: string } {
    const data = loadData();
    const idx = data.bookings.findIndex(b => b.code === reviewPayload.bookingCode);
    if (idx === -1) return { success: false, message: 'Không tìm thấy đơn đặt phòng.' };
    if (data.bookings[idx].isReviewed) return { success: false, message: 'Đơn này đã được đánh giá (TC-12).' };

    data.reviews.push({
      id: data.reviews.length + 1,
      ...reviewPayload,
      date: new Date().toLocaleDateString('vi-VN'),
    });
    data.bookings[idx].isReviewed = true;
    saveData(data);
    return { success: true };
  },

  getReviewsByProperty(propertyId: number | string): Review[] {
    const data = loadData();
    return data.reviews.filter(r => r.propertyId === parseInt(String(propertyId), 10));
  },

  // UC-06–07: Host property / room management
  getHostProperties(ownerUsername: string): Property[] {
    const data = loadData();
    return data.properties.filter(p => p.owner === ownerUsername);
  },

  addProperty(propertyPayload: Partial<Property>): { success: boolean; property: Property } {
    const data = loadData();
    const newProp: Property = {
      id: data.properties.length + 1,
      owner: propertyPayload.owner || 'host.demo',
      name: propertyPayload.name || 'Homestay mới',
      type: propertyPayload.type || 'Homestay',
      address: propertyPayload.address || 'Hà Nội',
      city: propertyPayload.city || 'Hà Nội',
      area: propertyPayload.area || '',
      rating: 5.0,
      reviewsCount: 0,
      priceMin: propertyPayload.priceMin || 500000,
      desc: propertyPayload.desc || '',
      image: propertyPayload.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      amenities: propertyPayload.amenities || ['Wifi', 'Điều hòa'],
    };
    data.properties.push(newProp);
    saveData(data);
    return { success: true, property: newProp };
  },

  deleteProperty(id: number): { success: boolean } {
    const data = loadData();
    data.properties = data.properties.filter(p => p.id !== id);
    saveData(data);
    return { success: true };
  },

  getAllRooms(): Room[] {
    const data = loadData();
    return data.rooms;
  },

  addRoom(roomPayload: Partial<Room>): { success: boolean; room: Room } {
    const data = loadData();
    const newRoom: Room = {
      id: data.rooms.length + 1,
      propertyId: roomPayload.propertyId || 1,
      propertyName: roomPayload.propertyName || 'ODauDay Stay Hồ Tây',
      name: roomPayload.name || 'Phòng Mới',
      capacity: roomPayload.capacity || 2,
      price: roomPayload.price || 600000,
      weekendPrice: roomPayload.weekendPrice || 700000,
      desc: roomPayload.desc || '',
      status: 'ACTIVE',
    };
    data.rooms.push(newRoom);
    saveData(data);
    return { success: true, room: newRoom };
  },

  deleteRoom(id: number): { success: boolean } {
    const data = loadData();
    data.rooms = data.rooms.filter(r => r.id !== id);
    saveData(data);
    return { success: true };
  },

  addRoomBlock(blockPayload: { roomId: number | string; roomName?: string; start: string; end: string; reason: string }): {
    success: boolean;
    code?: string;
    message?: string;
  } {
    const data = loadData();
    const rId = parseInt(String(blockPayload.roomId), 10);
    const conflict = this.checkConflict(rId, blockPayload.start, blockPayload.end);
    if (conflict.hasConflict) {
      return { success: false, code: 'BLOCK_CONFLICT', message: 'Xung đột lịch (TC-13): ' + conflict.reason };
    }
    const room = data.rooms.find(r => r.id === rId);
    data.roomBlocks.push({
      id: data.roomBlocks.length + 1,
      roomId: rId,
      roomName: blockPayload.roomName || room?.name || 'Phòng Family',
      start: blockPayload.start,
      end: blockPayload.end,
      reason: blockPayload.reason,
    });
    saveData(data);
    return { success: true };
  },

  deleteRoomBlock(id: number): { success: boolean } {
    const data = loadData();
    data.roomBlocks = data.roomBlocks.filter(b => b.id !== id);
    saveData(data);
    return { success: true };
  },

  getRoomBlocks(roomId?: number | string): RoomBlock[] {
    const data = loadData();
    if (roomId) return data.roomBlocks.filter(b => b.roomId === parseInt(String(roomId), 10));
    return data.roomBlocks;
  },

  // UC-08: Host booking management
  getAllBookings(): Booking[] {
    const data = loadData();
    return data.bookings;
  },

  updateBookingStatus(code: string, newStatus: Booking['status']): { success: boolean; message?: string } {
    const data = loadData();
    const idx = data.bookings.findIndex(b => b.code === code);
    if (idx === -1) return { success: false, message: 'Không tìm thấy đơn.' };
    data.bookings[idx].status = newStatus;
    saveData(data);
    return { success: true };
  },

  // UC-09: Revenue
  getRevenueData(ownerUsername: string) {
    const data = loadData();
    const ownerProps = data.properties.filter(p => p.owner === ownerUsername).map(p => p.id);
    const completedBookings = data.bookings.filter(b => ownerProps.includes(b.propertyId) && b.status === 'COMPLETED');
    const cancelledBookings = data.bookings.filter(b => ownerProps.includes(b.propertyId) && b.status === 'CANCELLED');
    const pendingBookings = data.bookings.filter(b => ownerProps.includes(b.propertyId) && b.status === 'PENDING');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.total, 0);
    return {
      totalRevenue,
      completedBookings,
      cancelledBookings,
      pendingBookings,
      count: completedBookings.length,
    };
  },

  // UC-10: Admin user management
  getAllUsers(): User[] {
    const data = loadData();
    return data.users;
  },

  addUser(userPayload: Partial<User>): { success: boolean; message?: string; user?: User } {
    return this.register(userPayload);
  },

  toggleUserStatus(userId: number | string): { success: boolean; newStatus?: 'ACTIVE' | 'LOCKED' } {
    const data = loadData();
    const idx = data.users.findIndex(u => u.id === parseInt(String(userId), 10));
    if (idx === -1) return { success: false };
    data.users[idx].status = data.users[idx].status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    saveData(data);
    return { success: true, newStatus: data.users[idx].status };
  },

  changeUserRole(userId: number | string, newRole: User['role']): { success: boolean } {
    const data = loadData();
    const idx = data.users.findIndex(u => u.id === parseInt(String(userId), 10));
    if (idx === -1) return { success: false };
    data.users[idx].role = newRole;
    saveData(data);
    return { success: true };
  },
};

export default ODDStore;
