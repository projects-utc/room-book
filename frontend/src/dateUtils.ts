// Tiện ích ngày theo giờ địa phương, dùng cho dữ liệu mẫu và giá trị mặc định của form.
// Dữ liệu demo tính theo "hôm nay" để không bao giờ xuất hiện ngày tạo ở tương lai.

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function shifted(offsetDays: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0); // tránh lệch ngày khi đổi giờ mùa hè
  d.setDate(d.getDate() + offsetDays);
  return d;
}

/** Ngày cách hôm nay offsetDays (âm là quá khứ), định dạng yyyy-MM-dd. */
export function daysFromToday(offsetDays: number): string {
  const d = shifted(offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Như daysFromToday nhưng định dạng dd/MM/yyyy (dùng cho đánh giá). */
export function daysFromTodayVi(offsetDays: number): string {
  const d = shifted(offsetDays);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Thời điểm cách hôm nay offsetDays, định dạng yyyy-MM-dd HH:mm:ss (dùng cho nhật ký). */
export function timestampFromToday(offsetDays: number, time: string): string {
  return `${daysFromToday(offsetDays)} ${time}`;
}
