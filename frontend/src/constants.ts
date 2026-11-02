// ODauDay Stay — Global Constants
export const APP_NAME = 'ODauDay Stay';
export const STORAGE_KEY = 'ODD_STAY_DATA_V1';
export const USER_KEY = 'ODD_CURRENT_USER_V1';

export const ROLES = {
  ADMIN: 'ADMIN',
  HOST: 'HOST',
  GUEST: 'GUEST',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
} as const;

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const BADGE_CLASS: Record<string, string> = {
  PENDING: 'badge-pending',
  CONFIRMED: 'badge-confirmed',
  CHECKED_IN: 'badge-checked',
  COMPLETED: 'badge-completed',
  CANCELLED: 'badge-cancelled',
  REJECTED: 'badge-rejected',
};

export const BADGE_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đang lưu trú',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Đã từ chối',
};

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  LOCKED: 'LOCKED',
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const formatVND = (amount: number | string): string => {
  const n = typeof amount === 'number' ? amount : Number(amount) || 0;
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
};
