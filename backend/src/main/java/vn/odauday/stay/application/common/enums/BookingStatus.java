package vn.odauday.stay.application.common.enums;

import java.util.EnumSet;
import java.util.Set;

/**
 * Vòng đời đơn đặt phòng (state machine):
 *
 * <pre>
 * PENDING ──► CONFIRMED ──► CHECKED_IN ──► COMPLETED
 *    │            │
 *    │            └──────► CANCELLED
 *    ├──────────────────► CANCELLED
 *    └──────────────────► REJECTED
 * </pre>
 *
 * COMPLETED, CANCELLED, REJECTED là trạng thái kết thúc, không chuyển tiếp được nữa.
 */
public enum BookingStatus {
    PENDING,
    CONFIRMED,
    CHECKED_IN,
    COMPLETED,
    CANCELLED,
    REJECTED;

    /** Các trạng thái được phép chuyển tới từ trạng thái hiện tại. */
    public Set<BookingStatus> allowedNext() {
        return switch (this) {
            case PENDING -> EnumSet.of(CONFIRMED, REJECTED, CANCELLED);
            case CONFIRMED -> EnumSet.of(CHECKED_IN, CANCELLED);
            case CHECKED_IN -> EnumSet.of(COMPLETED);
            case COMPLETED, CANCELLED, REJECTED -> EnumSet.noneOf(BookingStatus.class);
        };
    }

    public boolean canMoveTo(BookingStatus next) {
        return allowedNext().contains(next);
    }

    public boolean isTerminal() {
        return allowedNext().isEmpty();
    }

    /** Đọc trạng thái từ chuỗi (không phân biệt hoa thường). Chuỗi lạ thì ném IllegalArgumentException. */
    public static BookingStatus parse(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Trạng thái không được để trống");
        }
        try {
            return BookingStatus.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + raw.trim());
        }
    }

    /** Dữ liệu cũ có thể null/rỗng/lạ: coi như PENDING để không làm hỏng luồng. */
    public static BookingStatus fromStored(String stored) {
        try {
            return parse(stored);
        } catch (IllegalArgumentException e) {
            return PENDING;
        }
    }
}
