// ODauDay Stay — Global Constants
export const APP_NAME = 'ODauDay Stay';
export const STORAGE_KEY = 'ODD_STAY_DATA_V2';
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

export interface BookingPaymentInfo {
  isDeposit30: boolean;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: string;
  paymentType: 'DEPOSIT_30' | 'FULL_100';
}

export function getBookingPaymentInfo(b: any): BookingPaymentInfo {
  if (!b) {
    return {
      isDeposit30: false,
      total: 0,
      paidAmount: 0,
      remainingAmount: 0,
      paymentMethod: 'BANK_TRANSFER',
      paymentType: 'FULL_100',
    };
  }

  const total = Number(b.total) || 0;
  const rawMethod = (b.paymentMethod || b.payment_method || '').toUpperCase();
  const rawType = (b.paymentType || b.payment_type || '').toUpperCase();

  const rawPaid = b.paidAmount ?? b.paid_amount;
  const hasExplicitPaid = rawPaid !== undefined && rawPaid !== null && !Number.isNaN(Number(rawPaid));
  const numPaid = hasExplicitPaid ? Number(rawPaid) : undefined;

  const isDeposit30 =
    rawType === 'DEPOSIT_30' ||
    rawMethod === 'CASH' ||
    rawMethod === 'COD' ||
    (rawMethod === '' && rawType !== 'FULL_100') ||
    (numPaid !== undefined && numPaid < total);

  const paymentType: 'DEPOSIT_30' | 'FULL_100' = isDeposit30 ? 'DEPOSIT_30' : 'FULL_100';
  const paidAmount = numPaid !== undefined ? numPaid : (isDeposit30 ? Math.round(total * 0.3) : total);

  const rawRemaining = b.remainingAmount ?? b.remaining_amount;
  const hasExplicitRemaining = rawRemaining !== undefined && rawRemaining !== null && !Number.isNaN(Number(rawRemaining));
  const remainingAmount = hasExplicitRemaining ? Number(rawRemaining) : Math.max(0, total - paidAmount);

  return {
    isDeposit30,
    total,
    paidAmount,
    remainingAmount,
    paymentMethod: rawMethod || (isDeposit30 ? 'CASH' : 'BANK_TRANSFER'),
    paymentType,
  };
}
