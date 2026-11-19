package vn.odauday.stay.application.service.booking;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.odauday.stay.application.common.CurrentUser;
import vn.odauday.stay.application.common.enums.BookingStatus;
import vn.odauday.stay.application.model.booking.CreateBookingRequest;
import vn.odauday.stay.application.service.audit.AuditLogService;
import vn.odauday.stay.application.service.promotion.PromotionService;
import vn.odauday.stay.domain.booking.model.BookingEntity;
import vn.odauday.stay.domain.booking.persistent.BookingRepository;
import vn.odauday.stay.domain.property.model.PropertyEntity;
import vn.odauday.stay.domain.property.persistent.PropertyRepository;
import vn.odauday.stay.domain.room.model.RoomEntity;
import vn.odauday.stay.domain.room.persistent.RoomBlockRepository;
import vn.odauday.stay.domain.room.persistent.RoomRepository;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private static final int MAX_NIGHTS = 365;

    private final BookingRepository bookingRepository;
    private final AuditLogService auditLogService;
    private final RoomRepository roomRepository;
    private final RoomBlockRepository roomBlockRepository;
    private final PropertyRepository propertyRepository;
    private final PromotionService promotionService;

    @Value("${app.revenue.platform-fee-rate:0.15}")
    private double platformFeeRate = 0.15;

    // ------------------------------------------------------------------ đọc

    /**
     * ADMIN xem tất cả; HOST xem đơn thuộc chỗ nghỉ của mình; người dùng khác chỉ xem đơn của chính mình.
     * guestUsername chỉ là bộ lọc thu hẹp, không bao giờ mở rộng quyền xem.
     */
    @Transactional(readOnly = true)
    public List<BookingEntity> getBookings(String guestUsername, CurrentUser user) {
        String filter = guestUsername != null && !guestUsername.isBlank() ? guestUsername.trim() : null;

        if (user.isAdmin()) {
            return filter != null ? bookingRepository.findByGuestUsernameOrderByIdDesc(filter) : bookingRepository.findAllByOrderByIdDesc();
        }

        if (user.isHost() && (filter == null || !filter.equals(user.username()))) {
            Set<Long> ownPropertyIds = ownedPropertyIds(user.username());
            return bookingRepository.findAllByOrderByIdDesc().stream()
                    .filter(b -> b.getPropertyId() != null && ownPropertyIds.contains(b.getPropertyId()))
                    .filter(b -> filter == null || filter.equals(b.getGuestUsername()))
                    .toList();
        }

        if (filter != null && !filter.equals(user.username())) {
            return List.of();
        }
        return bookingRepository.findByGuestUsernameOrderByIdDesc(user.username());
    }

    @Transactional(readOnly = true)
    public BookingEntity getBookingByCode(String code, CurrentUser user) {
        BookingEntity booking = findByCode(code);
        assertCanView(booking, user);
        return booking;
    }

    private BookingEntity findByCode(String code) {
        return bookingRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng có mã: " + code));
    }

    // ------------------------------------------------------------------ tạo đơn

    /**
     * Tạo đơn đặt phòng. Người đặt lấy từ JWT; đơn giá, thành tiền, tổng tiền, trạng thái và
     * tên chỗ nghỉ/phòng đều do server tính từ dữ liệu trong DB, không nhận từ client.
     */
    @Transactional
    public BookingEntity createBooking(CreateBookingRequest request, String guestUsername) {
        LocalDate checkIn = parseDate(request.getCheckIn());
        LocalDate checkOut = parseDate(request.getCheckOut());
        if (checkIn.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Ngày nhận phòng không được nhỏ hơn ngày hiện tại");
        }
        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Ngày trả phòng phải sau ngày nhận phòng");
        }
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        if (nights > MAX_NIGHTS) {
            throw new IllegalArgumentException("Thời gian lưu trú tối đa là " + MAX_NIGHTS + " đêm");
        }

        // Khóa dòng phòng đến hết giao dịch: hai người đặt cùng phòng cùng lúc sẽ được xử lý lần lượt,
        // nên bước kiểm tra trùng lịch bên dưới luôn thấy đơn vừa được lưu của người đến trước.
        RoomEntity room = roomRepository.findByIdForUpdate(request.getRoomId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng có ID: " + request.getRoomId()));
        if (!room.getPropertyId().equals(request.getPropertyId())) {
            throw new IllegalArgumentException("Phòng không thuộc cơ sở lưu trú đã chọn");
        }
        if (room.getStatus() != null && !"ACTIVE".equalsIgnoreCase(room.getStatus())) {
            throw new IllegalArgumentException("Phòng hiện không nhận đặt");
        }
        if (room.getPrice() == null || room.getPrice() < 0) {
            throw new IllegalArgumentException("Phòng chưa có đơn giá hợp lệ");
        }
        if (room.getCapacity() != null && request.getGuests() > room.getCapacity()) {
            throw new IllegalArgumentException("Số khách vượt quá sức chứa tối đa của phòng (" + room.getCapacity() + " khách)");
        }

        PropertyEntity property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy cơ sở lưu trú có ID: " + request.getPropertyId()));
        if (property.getStatus() != null && !"ACTIVE".equalsIgnoreCase(property.getStatus())) {
            throw new IllegalArgumentException("Cơ sở lưu trú hiện đang tạm khóa, không thể đặt phòng");
        }

        String checkInStr = checkIn.toString();
        String checkOutStr = checkOut.toString();
        if (!bookingRepository.findOverlappingBookings(room.getId(), checkInStr, checkOutStr).isEmpty()) {
            throw new IllegalArgumentException("Phòng đã có người đặt trong khoảng thời gian này");
        }
        if (!roomBlockRepository.findOverlappingBlocks(room.getId(), checkInStr, checkOutStr).isEmpty()) {
            throw new IllegalArgumentException("Phòng đang được chủ nhà khóa bảo trì trong khoảng thời gian này");
        }

        double pricePerNight = room.getPrice();
        double subtotal = pricePerNight * nights;
        double serviceFee = 0.0;
        double discountAmount = 0.0;
        if (hasText(request.getPromoCode())) {
            Map<String, Object> promoResult = promotionService.validateAndCalculateDiscount(request.getPromoCode(), subtotal);
            discountAmount = ((Number) promoResult.get("discountAmount")).doubleValue();
        }
        double total = Math.max(0.0, subtotal + serviceFee - discountAmount);

        BookingEntity booking = BookingEntity.builder()
                .code(generateUniqueCode())
                .guestUsername(guestUsername)
                .guestName(hasText(request.getGuestName()) ? request.getGuestName().trim() : guestUsername)
                .guestPhone(trimOrNull(request.getGuestPhone()))
                .guestEmail(trimOrNull(request.getGuestEmail()))
                .propertyId(property.getId())
                .propertyName(property.getName())
                .roomId(room.getId())
                .roomName(room.getName())
                .checkIn(checkInStr)
                .checkOut(checkOutStr)
                .nights((int) nights)
                .guests(request.getGuests())
                .pricePerNight(pricePerNight)
                .subtotal(subtotal)
                .serviceFee(serviceFee)
                .total(total)
                .status(BookingStatus.PENDING.name())
                .paymentMethod(trimOrNull(request.getPaymentMethod()))
                .createdAt(LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE))
                .isReviewed(false)
                .build();

        BookingEntity saved = bookingRepository.save(booking);
        if (hasText(request.getPromoCode())) {
            promotionService.incrementUsedCount(request.getPromoCode());
        }
        log.info("Booking created: {} | guest={} | nights={} | total={}",
                saved.getCode(), guestUsername, saved.getNights(), saved.getTotal());
        return saved;
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            String code = "ODD-" + LocalDate.now().getYear() + "-"
                    + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
            if (bookingRepository.findByCode(code).isEmpty()) {
                return code;
            }
        }
        throw new IllegalStateException("Không thể sinh mã đặt phòng duy nhất, vui lòng thử lại");
    }

    private static LocalDate parseDate(String raw) {
        String s = raw.trim();
        try {
            return LocalDate.parse(s.substring(0, Math.min(10, s.length())));
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Định dạng ngày không hợp lệ, yêu cầu định dạng YYYY-MM-DD");
        }
    }

    // ------------------------------------------------------------------ đổi trạng thái / hủy

    /** Đổi trạng thái theo state machine {@link BookingStatus}; bước nhảy không hợp lệ bị từ chối. */
    @Transactional
    public BookingEntity updateBookingStatus(String code, String newStatus, CurrentUser user) {
        BookingStatus next = BookingStatus.parse(newStatus);
        BookingEntity b = findByCode(code);
        assertCanManage(b, user);
        transition(b, next);
        return bookingRepository.save(b);
    }

    /** Khách tự hủy đơn của chính mình (hoặc ADMIN). Chỉ hủy được khi đơn còn PENDING hoặc CONFIRMED. */
    @Transactional
    public BookingEntity cancelBooking(String code, CurrentUser user) {
        BookingEntity b = findByCode(code);
        if (!user.isAdmin() && !user.username().equals(b.getGuestUsername())) {
            throw new AccessDeniedException("Bạn chỉ được hủy đơn đặt phòng của chính mình");
        }
        transition(b, BookingStatus.CANCELLED);
        return bookingRepository.save(b);
    }

    /**
     * Admin can thiệp hủy đơn. Đây là thao tác ngoại lệ có ghi audit log nên được phép hủy cả đơn đang ở
     * trạng thái CHECKED_IN hoặc COMPLETED (ví dụ gian lận, hoàn tiền). Đơn đã CANCELLED/REJECTED thì không hủy lại.
     */
    @Transactional
    public BookingEntity adminCancelBooking(String code, String reason, CurrentUser admin) {
        admin.requireAdmin();
        BookingEntity b = findByCode(code);
        BookingStatus current = BookingStatus.fromStored(b.getStatus());
        if (current == BookingStatus.CANCELLED || current == BookingStatus.REJECTED) {
            throw new IllegalArgumentException("Đơn đặt phòng đã ở trạng thái " + current + ", không thể hủy lại");
        }
        b.setStatus(BookingStatus.CANCELLED.name());
        BookingEntity saved = bookingRepository.save(b);
        String finalReason = reason != null && !reason.isBlank() ? reason : "Admin can thiệp hủy đơn";
        auditLogService.logAudit("CANCEL_BOOKING", code, "Admin can thiệp hủy đơn: " + finalReason, admin.username());
        return saved;
    }

    private void transition(BookingEntity booking, BookingStatus next) {
        BookingStatus current = BookingStatus.fromStored(booking.getStatus());
        if (!current.canMoveTo(next)) {
            String allowed = current.allowedNext().isEmpty() ? "không có (trạng thái kết thúc)" : current.allowedNext().toString();
            throw new IllegalArgumentException(
                    "Không thể chuyển đơn từ " + current + " sang " + next + ". Trạng thái tiếp theo hợp lệ: " + allowed);
        }
        booking.setStatus(next.name());
    }

    // ------------------------------------------------------------------ doanh thu

    /** HOST chỉ thấy doanh thu của chính mình; ADMIN có thể lọc theo owner hoặc xem toàn hệ thống. */
    @Transactional(readOnly = true)
    public Map<String, Object> getRevenueSummary(String ownerUsername, CurrentUser user) {
        String owner = user.isHost() ? user.username()
                : (ownerUsername != null && !ownerUsername.isBlank() ? ownerUsername.trim() : null);
        if (!user.isHost() && !user.isAdmin()) {
            throw new AccessDeniedException("Bạn không có quyền xem báo cáo doanh thu");
        }

        List<BookingEntity> scopedBookings = bookingRepository.findAll();
        if (owner != null) {
            Set<Long> ownerPropertyIds = ownedPropertyIds(owner);
            scopedBookings = scopedBookings.stream()
                    .filter(b -> b.getPropertyId() != null && ownerPropertyIds.contains(b.getPropertyId()))
                    .toList();
        }

        List<BookingEntity> completedBookings = scopedBookings.stream()
                .filter(b -> "COMPLETED".equalsIgnoreCase(b.getStatus()))
                .toList();
        List<BookingEntity> cancelledBookings = scopedBookings.stream()
                .filter(b -> "CANCELLED".equalsIgnoreCase(b.getStatus()))
                .toList();
        List<BookingEntity> pendingBookings = scopedBookings.stream()
                .filter(b -> "PENDING".equalsIgnoreCase(b.getStatus()))
                .toList();

        double totalRevenue = completedBookings.stream()
                .mapToDouble(b -> b.getTotal() != null ? b.getTotal() : 0.0)
                .sum();
        double platformFee = Math.round(totalRevenue * platformFeeRate);
        double netRevenue = totalRevenue - platformFee;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalBookings", scopedBookings.size());
        result.put("totalRevenue", totalRevenue);
        result.put("platformFeeRate", platformFeeRate);
        result.put("platformFee", platformFee);
        result.put("netRevenue", netRevenue);
        result.put("count", completedBookings.size());
        result.put("completedBookings", completedBookings);
        result.put("cancelledBookings", cancelledBookings);
        result.put("pendingBookings", pendingBookings);
        return result;
    }

    // ------------------------------------------------------------------ kiểm tra quyền

    /** Xem được: ADMIN, người đặt, hoặc chủ của chỗ nghỉ được đặt. */
    private void assertCanView(BookingEntity booking, CurrentUser user) {
        if (user.isAdmin() || user.username().equals(booking.getGuestUsername()) || ownsProperty(booking, user)) {
            return;
        }
        throw new AccessDeniedException("Bạn không có quyền xem đơn đặt phòng này");
    }

    /** Quản lý (đổi trạng thái): ADMIN hoặc chủ của chỗ nghỉ được đặt. */
    private void assertCanManage(BookingEntity booking, CurrentUser user) {
        if (user.isAdmin() || ownsProperty(booking, user)) {
            return;
        }
        throw new AccessDeniedException("Bạn không có quyền quản lý đơn đặt phòng này");
    }

    private boolean ownsProperty(BookingEntity booking, CurrentUser user) {
        if (!user.isHost() || booking.getPropertyId() == null) {
            return false;
        }
        return propertyRepository.findById(booking.getPropertyId())
                .map(p -> user.username().equalsIgnoreCase(p.getOwner()))
                .orElse(false);
    }

    private Set<Long> ownedPropertyIds(String ownerUsername) {
        return propertyRepository.findByOwner(ownerUsername).stream()
                .map(PropertyEntity::getId)
                .collect(Collectors.toSet());
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    private static String trimOrNull(String s) {
        return hasText(s) ? s.trim() : null;
    }
}
