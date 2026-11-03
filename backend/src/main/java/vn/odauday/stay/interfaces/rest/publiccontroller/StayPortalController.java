package vn.odauday.stay.interfaces.rest.publiccontroller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import vn.odauday.stay.application.common.ApiResponse;
import vn.odauday.stay.application.config.DataInitializer;
import vn.odauday.stay.application.model.user.UserResponse;
import vn.odauday.stay.application.service.user.AuthService;
import vn.odauday.stay.domain.audit.model.AuditLogEntity;
import vn.odauday.stay.domain.audit.persistent.AuditLogRepository;
import vn.odauday.stay.domain.booking.model.BookingEntity;
import vn.odauday.stay.domain.booking.persistent.BookingRepository;
import vn.odauday.stay.domain.property.model.PropertyEntity;
import vn.odauday.stay.domain.property.persistent.PropertyRepository;
import vn.odauday.stay.domain.promotion.model.PromotionEntity;
import vn.odauday.stay.domain.promotion.persistent.PromotionRepository;
import vn.odauday.stay.domain.review.model.ReviewEntity;
import vn.odauday.stay.domain.review.persistent.ReviewRepository;
import vn.odauday.stay.domain.room.model.RoomBlockEntity;
import vn.odauday.stay.domain.room.model.RoomEntity;
import vn.odauday.stay.domain.room.persistent.RoomBlockRepository;
import vn.odauday.stay.domain.room.persistent.RoomRepository;
import vn.odauday.stay.domain.user.model.User;
import vn.odauday.stay.domain.user.persistent.UserRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StayPortalController {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final RoomBlockRepository roomBlockRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final PromotionRepository promotionRepository;
    private final AuditLogRepository auditLogRepository;
    private final DataInitializer dataInitializer;
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SystemState {
        private List<UserResponse> users;
        private List<PropertyEntity> properties;
        private List<RoomEntity> rooms;
        private List<RoomBlockEntity> roomBlocks;
        private List<BookingEntity> bookings;
        private List<ReviewEntity> reviews;
        private List<PromotionEntity> promotions;
        private List<AuditLogEntity> auditLogs;
    }

    // ==========================================
    // 1. SYSTEM STATE (SYNC ALL FROM ORACLE DB)
    // ==========================================
    @GetMapping("/state")
    public ApiResponse<SystemState> getSystemState() {
        List<UserResponse> users = userRepository.findAll().stream()
                .map(authService::toUserResponse)
                .collect(Collectors.toList());

        SystemState state = SystemState.builder()
                .users(users)
                .properties(propertyRepository.findAll())
                .rooms(roomRepository.findAll())
                .roomBlocks(roomBlockRepository.findAll())
                .bookings(bookingRepository.findAll())
                .reviews(reviewRepository.findAll())
                .promotions(promotionRepository.findAll())
                .auditLogs(auditLogRepository.findAll())
                .build();

        return ApiResponse.ok(state);
    }

    @PostMapping("/state/reset")
    public ApiResponse<SystemState> resetSystemState() {
        dataInitializer.resetAllData();
        return getSystemState();
    }

    // ==========================================
    // 2. PROPERTIES
    // ==========================================
    @GetMapping("/properties")
    public ApiResponse<List<PropertyEntity>> getProperties() {
        return ApiResponse.ok(propertyRepository.findAll());
    }

    @GetMapping("/properties/{id}")
    public ApiResponse<PropertyEntity> getPropertyById(@PathVariable Long id) {
        return propertyRepository.findById(id)
                .map(ApiResponse::ok)
                .orElse(ApiResponse.error("Không tìm thấy cơ sở lưu trú"));
    }

    @PostMapping("/properties")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PropertyEntity> createProperty(@RequestBody PropertyEntity property) {
        PropertyEntity saved = propertyRepository.save(property);
        logAudit("CREATE_PROPERTY", saved.getName(), "Tạo mới cơ sở lưu trú: " + saved.getName(), saved.getOwner());
        return ApiResponse.ok("Đã tạo cơ sở lưu trú thành công", saved);
    }

    @DeleteMapping("/properties/{id}")
    public ApiResponse<Void> deleteProperty(@PathVariable Long id) {
        propertyRepository.findById(id).ifPresent(p -> {
            propertyRepository.delete(p);
            logAudit("DELETE_PROPERTY", p.getName(), "Xóa cơ sở lưu trú: " + p.getName(), "admin");
        });
        return ApiResponse.ok("Đã xóa cơ sở lưu trú", null);
    }

    @PatchMapping("/properties/{id}/toggle-status")
    public ApiResponse<PropertyEntity> togglePropertyStatus(@PathVariable Long id) {
        return propertyRepository.findById(id).map(p -> {
            String nextStatus = "ACTIVE".equalsIgnoreCase(p.getStatus()) ? "LOCKED" : "ACTIVE";
            p.setStatus(nextStatus);
            PropertyEntity saved = propertyRepository.save(p);
            logAudit("TOGGLE_PROPERTY", p.getName(), "LOCKED".equals(nextStatus) ? "Tạm khóa cơ sở lưu trú" : "Mở khóa cơ sở lưu trú", "admin");
            return ApiResponse.ok("Đã cập nhật trạng thái cơ sở lưu trú", saved);
        }).orElse(ApiResponse.error("Không tìm thấy cơ sở lưu trú"));
    }

    // ==========================================
    // 3. ROOMS
    // ==========================================
    @GetMapping("/rooms")
    public ApiResponse<List<RoomEntity>> getRooms(@RequestParam(required = false) Long propertyId) {
        if (propertyId != null) {
            return ApiResponse.ok(roomRepository.findByPropertyId(propertyId));
        }
        return ApiResponse.ok(roomRepository.findAll());
    }

    @PostMapping("/rooms")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RoomEntity> createRoom(@RequestBody RoomEntity room) {
        RoomEntity saved = roomRepository.save(room);
        return ApiResponse.ok("Đã tạo phòng thành công", saved);
    }

    @DeleteMapping("/rooms/{id}")
    public ApiResponse<Void> deleteRoom(@PathVariable Long id) {
        roomRepository.deleteById(id);
        return ApiResponse.ok("Đã xóa phòng", null);
    }

    // ==========================================
    // 4. ROOM BLOCKS
    // ==========================================
    @GetMapping("/room-blocks")
    public ApiResponse<List<RoomBlockEntity>> getRoomBlocks(@RequestParam(required = false) Long roomId) {
        if (roomId != null) {
            return ApiResponse.ok(roomBlockRepository.findByRoomId(roomId));
        }
        return ApiResponse.ok(roomBlockRepository.findAll());
    }

    @PostMapping("/room-blocks")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RoomBlockEntity> createRoomBlock(@RequestBody RoomBlockEntity block) {
        RoomBlockEntity saved = roomBlockRepository.save(block);
        return ApiResponse.ok("Đã tạo lịch khóa phòng", saved);
    }

    @DeleteMapping("/room-blocks/{id}")
    public ApiResponse<Void> deleteRoomBlock(@PathVariable Long id) {
        roomBlockRepository.deleteById(id);
        return ApiResponse.ok("Đã xóa lịch khóa phòng", null);
    }

    // ==========================================
    // 5. BOOKINGS
    // ==========================================
    @GetMapping("/bookings")
    public ApiResponse<List<BookingEntity>> getBookings(@RequestParam(required = false) String guestUsername) {
        if (guestUsername != null && !guestUsername.isBlank()) {
            return ApiResponse.ok(bookingRepository.findByGuestUsername(guestUsername.trim()));
        }
        return ApiResponse.ok(bookingRepository.findAll());
    }

    @GetMapping("/bookings/{code}")
    public ApiResponse<BookingEntity> getBookingByCode(@PathVariable String code) {
        return bookingRepository.findByCode(code)
                .map(ApiResponse::ok)
                .orElse(ApiResponse.error("Không tìm thấy đơn đặt phòng"));
    }

    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BookingEntity> createBooking(@RequestBody BookingEntity booking) {
        if (booking.getCode() == null || booking.getCode().isBlank()) {
            booking.setCode("ODD-" + LocalDateTime.now().getYear() + "-" + (int) (1000 + Math.random() * 9000));
        }
        if (booking.getCreatedAt() == null || booking.getCreatedAt().isBlank()) {
            booking.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        }
        BookingEntity saved = bookingRepository.save(booking);
        log.info("Booking created in Oracle DB: {}", saved.getCode());
        return ApiResponse.ok("Đặt phòng thành công", saved);
    }

    @PatchMapping("/bookings/{code}/status")
    public ApiResponse<BookingEntity> updateBookingStatus(@PathVariable String code, @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            return ApiResponse.error("Trạng thái mới không được để trống");
        }
        return bookingRepository.findByCode(code).map(b -> {
            b.setStatus(newStatus.trim().toUpperCase());
            BookingEntity saved = bookingRepository.save(b);
            return ApiResponse.ok("Đã cập nhật trạng thái đơn đặt phòng", saved);
        }).orElse(ApiResponse.error("Không tìm thấy đơn đặt phòng"));
    }

    @PostMapping("/bookings/{code}/cancel")
    public ApiResponse<BookingEntity> cancelBooking(@PathVariable String code) {
        return bookingRepository.findByCode(code).map(b -> {
            b.setStatus("CANCELLED");
            BookingEntity saved = bookingRepository.save(b);
            return ApiResponse.ok("Đã hủy đơn đặt phòng", saved);
        }).orElse(ApiResponse.error("Không tìm thấy đơn đặt phòng"));
    }

    @PostMapping("/bookings/{code}/admin-cancel")
    public ApiResponse<BookingEntity> adminCancelBooking(@PathVariable String code, @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "Admin can thiệp hủy đơn") : "Admin can thiệp hủy đơn";
        return bookingRepository.findByCode(code).map(b -> {
            b.setStatus("CANCELLED");
            BookingEntity saved = bookingRepository.save(b);
            logAudit("CANCEL_BOOKING", code, "Admin can thiệp hủy đơn: " + reason, "admin");
            return ApiResponse.ok("Đã can thiệp hủy đơn đặt phòng", saved);
        }).orElse(ApiResponse.error("Không tìm thấy đơn đặt phòng"));
    }

    // ==========================================
    // 6. REVIEWS
    // ==========================================
    @GetMapping("/reviews")
    public ApiResponse<List<ReviewEntity>> getReviews(@RequestParam(required = false) Long propertyId) {
        if (propertyId != null) {
            return ApiResponse.ok(reviewRepository.findByPropertyId(propertyId));
        }
        return ApiResponse.ok(reviewRepository.findAll());
    }

    @PostMapping("/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ReviewEntity> submitReview(@RequestBody ReviewEntity review) {
        if (review.getDate() == null || review.getDate().isBlank()) {
            review.setDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        }
        ReviewEntity saved = reviewRepository.save(review);
        bookingRepository.findByCode(review.getBookingCode()).ifPresent(b -> {
            b.setIsReviewed(true);
            bookingRepository.save(b);
        });
        return ApiResponse.ok("Đã gửi đánh giá thành công", saved);
    }

    // ==========================================
    // 7. PROMOTIONS
    // ==========================================
    @GetMapping("/promotions")
    public ApiResponse<List<PromotionEntity>> getPromotions() {
        return ApiResponse.ok(promotionRepository.findAll());
    }

    @PostMapping("/promotions")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PromotionEntity> createPromotion(@RequestBody PromotionEntity promo) {
        String code = promo.getCode() != null ? promo.getCode().trim().toUpperCase() : "";
        if (code.isBlank()) {
            return ApiResponse.error("Mã giảm giá không được để trống");
        }
        if (promotionRepository.existsByCode(code)) {
            return ApiResponse.error("Mã giảm giá này đã tồn tại trên hệ thống");
        }
        promo.setCode(code);
        PromotionEntity saved = promotionRepository.save(promo);
        logAudit("CREATE_PROMO", code, "Tạo mới mã giảm giá: " + code, "admin");
        return ApiResponse.ok("Đã tạo mã giảm giá thành công", saved);
    }

    @PatchMapping("/promotions/{id}/toggle")
    public ApiResponse<PromotionEntity> togglePromotion(@PathVariable Long id) {
        return promotionRepository.findById(id).map(p -> {
            String nextStatus = "ACTIVE".equalsIgnoreCase(p.getStatus()) ? "INACTIVE" : "ACTIVE";
            p.setStatus(nextStatus);
            PromotionEntity saved = promotionRepository.save(p);
            return ApiResponse.ok("Đã cập nhật trạng thái mã giảm giá", saved);
        }).orElse(ApiResponse.error("Không tìm thấy mã giảm giá"));
    }

    @DeleteMapping("/promotions/{id}")
    public ApiResponse<Void> deletePromotion(@PathVariable Long id) {
        promotionRepository.findById(id).ifPresent(p -> {
            promotionRepository.delete(p);
            logAudit("DELETE_PROMO", p.getCode(), "Xóa mã giảm giá: " + p.getCode(), "admin");
        });
        return ApiResponse.ok("Đã xóa mã giảm giá", null);
    }

    // ==========================================
    // 8. USERS
    // ==========================================
    @GetMapping("/users")
    public ApiResponse<List<UserResponse>> getUsers() {
        List<UserResponse> list = userRepository.findAll().stream()
                .map(authService::toUserResponse)
                .collect(Collectors.toList());
        return ApiResponse.ok(list);
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<UserResponse> createUser(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.getOrDefault("password", "123");
        String fullName = body.get("fullName");
        String phone = body.getOrDefault("phone", "");
        String email = body.getOrDefault("email", "");
        String role = body.getOrDefault("role", "GUEST");

        if (username == null || username.isBlank() || fullName == null || fullName.isBlank()) {
            return ApiResponse.error("Thông tin người dùng không hợp lệ");
        }
        if (userRepository.existsByUsername(username.trim().toLowerCase())) {
            return ApiResponse.error("Tên đăng nhập đã tồn tại");
        }

        User u = User.builder()
                .username(username.trim().toLowerCase())
                .password(passwordEncoder.encode(password))
                .fullName(fullName.trim())
                .phone(phone.trim())
                .email(email.trim())
                .role(role.toUpperCase())
                .status("ACTIVE")
                .build();

        User saved = userRepository.save(u);
        return ApiResponse.ok("Đã tạo người dùng thành công", authService.toUserResponse(saved));
    }

    @PatchMapping("/users/{id}/toggle-status")
    public ApiResponse<UserResponse> toggleUserStatus(@PathVariable Long id) {
        return userRepository.findById(id).map(u -> {
            if ("admin".equalsIgnoreCase(u.getUsername())) {
                return ApiResponse.<UserResponse>error("Không thể khóa tài khoản quản trị viên tối cao");
            }
            String nextStatus = "ACTIVE".equalsIgnoreCase(u.getStatus()) ? "LOCKED" : "ACTIVE";
            u.setStatus(nextStatus);
            User saved = userRepository.save(u);
            logAudit(nextStatus.equals("LOCKED") ? "LOCK" : "UNLOCK", u.getUsername(), "Đổi trạng thái tài khoản: " + nextStatus, "admin");
            return ApiResponse.ok("Đã đổi trạng thái tài khoản", authService.toUserResponse(saved));
        }).orElse(ApiResponse.error("Không tìm thấy người dùng"));
    }

    @PatchMapping("/users/{id}/role")
    public ApiResponse<UserResponse> changeUserRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newRole = body.get("role");
        if (newRole == null || newRole.isBlank()) {
            return ApiResponse.error("Vai trò mới không được để trống");
        }
        return userRepository.findById(id).map(u -> {
            if ("admin".equalsIgnoreCase(u.getUsername()) && !"ADMIN".equalsIgnoreCase(newRole)) {
                return ApiResponse.<UserResponse>error("Không thể hạ quyền của tài khoản admin");
            }
            u.setRole(newRole.trim().toUpperCase());
            User saved = userRepository.save(u);
            logAudit("CHANGE_ROLE", u.getUsername(), "Thay đổi vai trò thành " + u.getRole(), "admin");
            return ApiResponse.ok("Đã thay đổi vai trò tài khoản", authService.toUserResponse(saved));
        }).orElse(ApiResponse.error("Không tìm thấy người dùng"));
    }

    // ==========================================
    // 9. AUDIT LOGS
    // ==========================================
    @GetMapping("/audit-logs")
    public ApiResponse<List<AuditLogEntity>> getAuditLogs() {
        return ApiResponse.ok(auditLogRepository.findAll());
    }

    @PostMapping("/audit-logs")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AuditLogEntity> createAuditLog(@RequestBody AuditLogEntity logEntity) {
        if (logEntity.getTimestamp() == null || logEntity.getTimestamp().isBlank()) {
            logEntity.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        }
        AuditLogEntity saved = auditLogRepository.save(logEntity);
        return ApiResponse.ok(saved);
    }

    private void logAudit(String action, String target, String details, String performedBy) {
        try {
            AuditLogEntity logEntity = AuditLogEntity.builder()
                    .action(action)
                    .target(target)
                    .details(details)
                    .performedBy(performedBy != null ? performedBy : "admin")
                    .timestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                    .build();
            auditLogRepository.save(logEntity);
        } catch (Exception e) {
            log.warn("Failed to write audit log: {}", e.getMessage());
        }
    }
}
