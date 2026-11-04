package vn.odauday.stay.application.service.booking;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.odauday.stay.application.model.booking.CreateBookingRequest;
import vn.odauday.stay.domain.booking.model.BookingEntity;
import vn.odauday.stay.domain.booking.model.BookingStatusHistoryEntity;
import vn.odauday.stay.domain.booking.persistent.BookingRepository;
import vn.odauday.stay.domain.booking.persistent.BookingStatusHistoryRepository;
import vn.odauday.stay.domain.property.model.PropertyEntity;
import vn.odauday.stay.domain.property.persistent.PropertyRepository;
import vn.odauday.stay.domain.room.model.RoomEntity;
import vn.odauday.stay.domain.room.persistent.RoomBlockRepository;
import vn.odauday.stay.domain.room.persistent.RoomRepository;
import vn.odauday.stay.domain.user.model.User;
import vn.odauday.stay.domain.user.persistent.UserRepository;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final List<String> OCCUPYING_STATUSES = List.of("PENDING", "CONFIRMED", "CHECKED_IN");

    private final BookingRepository bookingRepository;
    private final BookingStatusHistoryRepository historyRepository;
    private final RoomRepository roomRepository;
    private final RoomBlockRepository roomBlockRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;

    @Transactional
    public BookingEntity create(CreateBookingRequest request, String guestUsername) {
        User guest = userRepository.findByUsername(guestUsername)
                .orElseThrow(() -> new AccessDeniedException("Tài khoản không còn hợp lệ"));
        if (!"GUEST".equalsIgnoreCase(guest.getRole())) {
            throw new AccessDeniedException("Chỉ tài khoản khách mới được tạo đơn đặt phòng");
        }

        LocalDate checkIn = parseDate(request.checkIn(), "Ngày nhận phòng");
        LocalDate checkOut = parseDate(request.checkOut(), "Ngày trả phòng");
        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm");
        }
        if (checkIn.isBefore(LocalDate.now(BUSINESS_ZONE))) {
            throw new IllegalArgumentException("Ngày nhận phòng không được ở quá khứ");
        }

        RoomEntity room = roomRepository.findByIdForUpdate(request.roomId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng"));
        if (!"ACTIVE".equalsIgnoreCase(room.getStatus())) {
            throw new IllegalStateException("Phòng hiện không nhận đặt chỗ");
        }
        if (!room.getPropertyId().equals(request.propertyId())) {
            throw new IllegalArgumentException("Phòng không thuộc cơ sở lưu trú đã chọn");
        }
        if (request.guests() > room.getCapacity()) {
            throw new IllegalArgumentException("Số khách vượt quá sức chứa của phòng");
        }

        PropertyEntity property = propertyRepository.findById(room.getPropertyId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy cơ sở lưu trú"));
        if (!"ACTIVE".equalsIgnoreCase(property.getStatus())) {
            throw new IllegalStateException("Cơ sở lưu trú hiện không nhận đặt chỗ");
        }

        String checkInText = checkIn.toString();
        String checkOutText = checkOut.toString();
        if (bookingRepository.existsOverlappingBooking(room.getId(), checkInText, checkOutText)
                || roomBlockRepository.existsOverlappingBlock(room.getId(), checkInText, checkOutText)) {
            throw new IllegalStateException("Phòng đã có đơn hoặc lịch khóa giao với khoảng ngày bạn chọn");
        }

        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        BigDecimal subtotal = calculateSubtotal(room, checkIn, checkOut);
        LocalDateTime now = LocalDateTime.now(BUSINESS_ZONE);
        BookingEntity booking = BookingEntity.builder()
                .code(generateBookingCode())
                .guestUsername(guest.getUsername())
                .guestName(firstNonBlank(request.guestName(), guest.getFullName()))
                .guestPhone(firstNonBlank(request.guestPhone(), guest.getPhone()))
                .guestEmail(firstNonBlank(request.guestEmail(), guest.getEmail()))
                .propertyId(property.getId())
                .propertyName(property.getName())
                .roomId(room.getId())
                .roomName(room.getName())
                .checkIn(checkInText)
                .checkOut(checkOutText)
                .nights(Math.toIntExact(nights))
                .guests(request.guests())
                .pricePerNight(subtotal.divide(BigDecimal.valueOf(nights), 2, java.math.RoundingMode.HALF_UP).doubleValue())
                .subtotal(subtotal.doubleValue())
                .serviceFee(0d)
                .total(subtotal.doubleValue())
                .status("PENDING")
                .createdAt(LocalDate.now(BUSINESS_ZONE).toString())
                .approvalDeadline(now.plusHours(24))
                .isReviewed(false)
                .build();

        BookingEntity saved = bookingRepository.save(booking);
        recordStatus(saved, null, "PENDING", guest.getId(), "Khách tạo đơn đặt phòng");
        return saved;
    }

    @Transactional(readOnly = true)
    public List<BookingEntity> listVisible(String username, String role) {
        if ("ADMIN".equalsIgnoreCase(role)) {
            return bookingRepository.findAllByOrderByCreatedAtDesc();
        }
        if ("HOST".equalsIgnoreCase(role)) {
            List<Long> propertyIds = propertyRepository.findByOwner(username).stream()
                    .map(PropertyEntity::getId)
                    .toList();
            return propertyIds.isEmpty()
                    ? List.of()
                    : bookingRepository.findAllByPropertyIdInOrderByCreatedAtDesc(propertyIds);
        }
        return bookingRepository.findAllByGuestUsernameOrderByCreatedAtDesc(username);
    }

    @Transactional(readOnly = true)
    public BookingEntity getVisible(String code, String username, String role) {
        BookingEntity booking = bookingRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));
        assertCanView(booking, username, role);
        return booking;
    }

    @Transactional
    public BookingEntity cancelByGuest(String code, String username) {
        BookingEntity booking = lockBooking(code);
        if (!booking.getGuestUsername().equalsIgnoreCase(username)) {
            throw new AccessDeniedException("Bạn không có quyền hủy đơn đặt phòng này");
        }
        if (!"PENDING".equals(booking.getStatus())) {
            throw new IllegalStateException("Chỉ có thể hủy đơn khi đơn còn ở trạng thái chờ chủ nhà duyệt");
        }
        return transition(booking, "CANCELLED", username, "GUEST", "Khách yêu cầu hủy đơn");
    }

    @Transactional
    public BookingEntity updateByHost(String code, String nextStatus, String username) {
        BookingEntity booking = lockBooking(code);
        PropertyEntity property = propertyRepository.findById(booking.getPropertyId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy cơ sở lưu trú"));
        if (!property.getOwner().equalsIgnoreCase(username)) {
            throw new AccessDeniedException("Chủ nhà chỉ được xử lý đơn của cơ sở lưu trú mình sở hữu");
        }
        return transition(booking, nextStatus, username, "HOST", "Chủ nhà cập nhật trạng thái đơn");
    }

    @Transactional
    public BookingEntity updateByAdmin(String code, String nextStatus, String username, String reason) {
        BookingEntity booking = lockBooking(code);
        String note = StringUtils.hasText(reason) ? reason.trim() : "Admin cập nhật trạng thái đơn";
        return transition(booking, nextStatus, username, "ADMIN", note);
    }

    @Transactional
    public BookingEntity cancelByAdmin(String code, String username, String reason) {
        BookingEntity booking = lockBooking(code);
        String note = StringUtils.hasText(reason) ? reason.trim() : "Admin can thiệp hủy đơn";
        return transition(booking, "CANCELLED", username, "ADMIN", note);
    }

    @Transactional
    public int cancelExpiredPendingBookings() {
        LocalDateTime now = LocalDateTime.now(BUSINESS_ZONE);
        List<BookingEntity> expired = bookingRepository.findAllByStatusAndApprovalDeadlineBefore("PENDING", now);
        int cancelled = 0;
        for (BookingEntity candidate : expired) {
            BookingEntity booking = lockBooking(candidate.getCode());
            if ("PENDING".equals(booking.getStatus())
                    && booking.getApprovalDeadline() != null
                    && booking.getApprovalDeadline().isBefore(now)) {
                transition(booking, "CANCELLED", null, "SYSTEM", "Tự hủy do quá hạn chủ nhà duyệt 24 giờ");
                cancelled++;
            }
        }
        return cancelled;
    }

    private BookingEntity transition(BookingEntity booking, String rawStatus,
                                     String actorUsername, String actorRole, String note) {
        String next = rawStatus == null ? "" : rawStatus.trim().toUpperCase(Locale.ROOT);
        String current = booking.getStatus() == null ? "PENDING" : booking.getStatus().toUpperCase(Locale.ROOT);
        if (!List.of("PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED").contains(next)) {
            throw new IllegalArgumentException("Trạng thái đơn không hợp lệ");
        }

        boolean allowed;
        if ("ADMIN".equals(actorRole)) {
            allowed = switch (current) {
                case "PENDING" -> "CONFIRMED".equals(next) || "CANCELLED".equals(next);
                case "CONFIRMED" -> "CHECKED_IN".equals(next) || "CANCELLED".equals(next);
                case "CHECKED_IN" -> "COMPLETED".equals(next) || "CANCELLED".equals(next);
                default -> false;
            };
        } else {
            allowed = switch (current) {
                case "PENDING" -> "CONFIRMED".equals(next) || "CANCELLED".equals(next);
                case "CONFIRMED" -> "CHECKED_IN".equals(next);
                case "CHECKED_IN" -> "COMPLETED".equals(next);
                default -> false;
            };
        }
        if (!allowed) {
            throw new IllegalStateException("Không thể chuyển đơn từ " + current + " sang " + next);
        }

        booking.setStatus(next);
        LocalDateTime now = LocalDateTime.now(BUSINESS_ZONE);
        if ("CONFIRMED".equals(next)) booking.setConfirmedAt(now);
        if ("CHECKED_IN".equals(next)) booking.setCheckedInAt(now);
        if ("COMPLETED".equals(next)) booking.setCheckedOutAt(now);
        if ("CANCELLED".equals(next)) {
            booking.setCancelledBy(actorRole);
            booking.setCancelReason(note);
        }

        BookingEntity saved = bookingRepository.save(booking);
        Long actorId = actorUsername == null ? null : userRepository.findByUsername(actorUsername)
                .map(User::getId).orElse(null);
        recordStatus(saved, current, next, actorId, note);
        return saved;
    }

    private void assertCanView(BookingEntity booking, String username, String role) {
        if ("ADMIN".equalsIgnoreCase(role) || booking.getGuestUsername().equalsIgnoreCase(username)) return;
        if ("HOST".equalsIgnoreCase(role)) {
            boolean ownsProperty = propertyRepository.findById(booking.getPropertyId())
                    .map(property -> property.getOwner().equalsIgnoreCase(username))
                    .orElse(false);
            if (ownsProperty) return;
        }
        throw new AccessDeniedException("Bạn không có quyền xem đơn đặt phòng này");
    }

    private BookingEntity lockBooking(String code) {
        return bookingRepository.findByCodeForUpdate(code)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));
    }

    private void recordStatus(BookingEntity booking, String oldStatus, String newStatus, Long changedBy, String note) {
        historyRepository.save(BookingStatusHistoryEntity.builder()
                .bookingId(booking.getId())
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .changedBy(changedBy)
                .note(note)
                .changedAt(LocalDateTime.now(BUSINESS_ZONE))
                .build());
    }

    private LocalDate parseDate(String value, String label) {
        try {
            return LocalDate.parse(value.trim());
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException(label + " không đúng định dạng YYYY-MM-DD");
        }
    }

    private BigDecimal calculateSubtotal(RoomEntity room, LocalDate checkIn, LocalDate checkOut) {
        BigDecimal weekday = BigDecimal.valueOf(room.getPrice());
        BigDecimal weekend = room.getWeekendPrice() == null
                ? weekday : BigDecimal.valueOf(room.getWeekendPrice());
        BigDecimal total = BigDecimal.ZERO;
        for (LocalDate date = checkIn; date.isBefore(checkOut); date = date.plusDays(1)) {
            DayOfWeek day = date.getDayOfWeek();
            total = total.add(day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY ? weekend : weekday);
        }
        return total.setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private String generateBookingCode() {
        String code;
        do {
            code = "ODD-" + LocalDate.now(BUSINESS_ZONE).getYear() + "-" +
                    UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase(Locale.ROOT);
        } while (bookingRepository.existsByCode(code));
        return code;
    }

    private String firstNonBlank(String supplied, String fallback) {
        return StringUtils.hasText(supplied) ? supplied.trim() : fallback;
    }
}
