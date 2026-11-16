package vn.odauday.stay.application.service.booking;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.odauday.stay.application.service.audit.AuditLogService;
import vn.odauday.stay.domain.booking.model.BookingEntity;
import vn.odauday.stay.domain.booking.persistent.BookingRepository;
import vn.odauday.stay.domain.property.model.PropertyEntity;
import vn.odauday.stay.domain.property.persistent.PropertyRepository;
import vn.odauday.stay.domain.room.model.RoomEntity;
import vn.odauday.stay.domain.room.persistent.RoomRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final AuditLogService auditLogService;
    private final RoomRepository roomRepository;
    private final PropertyRepository propertyRepository;

    @Transactional(readOnly = true)
    public List<BookingEntity> getBookings(String guestUsername) {
        if (guestUsername != null && !guestUsername.isBlank()) {
            return bookingRepository.findByGuestUsername(guestUsername.trim());
        }
        return bookingRepository.findAll();
    }

    @Transactional(readOnly = true)
    public BookingEntity getBookingByCode(String code) {
        return bookingRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng có mã: " + code));
    }

    @Transactional
    public BookingEntity createBooking(BookingEntity booking) {
        if (booking.getGuestUsername() == null || booking.getGuestUsername().isBlank()) {
            throw new IllegalArgumentException("Tên tài khoản người đặt không được để trống");
        }
        if (booking.getPropertyId() == null) {
            throw new IllegalArgumentException("Cơ sở lưu trú (propertyId) không được để trống");
        }
        if (booking.getRoomId() == null) {
            throw new IllegalArgumentException("Phòng đặt (roomId) không được để trống");
        }
        if (booking.getCheckIn() == null || booking.getCheckIn().isBlank()) {
            throw new IllegalArgumentException("Ngày nhận phòng không được để trống");
        }
        if (booking.getCheckOut() == null || booking.getCheckOut().isBlank()) {
            throw new IllegalArgumentException("Ngày trả phòng không được để trống");
        }

        try {
            LocalDate checkInDate = LocalDate.parse(booking.getCheckIn().trim().substring(0, Math.min(10, booking.getCheckIn().trim().length())));
            LocalDate checkOutDate = LocalDate.parse(booking.getCheckOut().trim().substring(0, Math.min(10, booking.getCheckOut().trim().length())));
            if (!checkOutDate.isAfter(checkInDate)) {
                throw new IllegalArgumentException("Ngày trả phòng phải sau ngày nhận phòng");
            }
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Định dạng ngày không hợp lệ, yêu cầu định dạng YYYY-MM-DD");
        }

        if (booking.getGuests() != null && booking.getGuests() <= 0) {
            throw new IllegalArgumentException("Số lượng khách phải lớn hơn 0");
        }
        if (booking.getPricePerNight() != null && booking.getPricePerNight() < 0) {
            throw new IllegalArgumentException("Đơn giá phòng không được là số âm");
        }

        List<BookingEntity> overlapping = bookingRepository.findOverlappingBookings(
                booking.getRoomId(), booking.getCheckIn().trim(), booking.getCheckOut().trim());
        if (!overlapping.isEmpty()) {
            throw new IllegalArgumentException("Phòng đã có người đặt trong khoảng thời gian này");
        }

        if (booking.getCode() == null || booking.getCode().isBlank()) {
            booking.setCode("ODD-" + LocalDateTime.now().getYear() + "-" + (int) (1000 + Math.random() * 9000));
        }
        if (booking.getCreatedAt() == null || booking.getCreatedAt().isBlank()) {
            booking.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        }
        if (booking.getStatus() == null || booking.getStatus().isBlank()) {
            booking.setStatus("PENDING");
        }

        // Kiểm tra sức chứa phòng
        if (booking.getRoomId() != null) {
            RoomEntity room = roomRepository.findById(booking.getRoomId()).orElse(null);
            if (room != null && room.getCapacity() != null && booking.getGuests() != null) {
                if (booking.getGuests() > room.getCapacity()) {
                    throw new IllegalArgumentException("Số lượng khách (" + booking.getGuests() + ") vượt quá sức chứa tối đa của phòng (" + room.getCapacity() + " người).");
                }
            }
        }

        // Tính lại nights, subtotal, total từ DB để đảm bảo đúng (không tin hoàn toàn vào FE)
        recalculatePricing(booking);

        BookingEntity saved = bookingRepository.save(booking);
        log.info("Booking created: {} | nights={} | total={}", saved.getCode(), saved.getNights(), saved.getTotal());
        return saved;
    }

    private void recalculatePricing(BookingEntity booking) {
        try {
            if (booking.getCheckIn() == null || booking.getCheckOut() == null) return;
            LocalDate dIn  = LocalDate.parse(booking.getCheckIn().trim().substring(0, 10));
            LocalDate dOut = LocalDate.parse(booking.getCheckOut().trim().substring(0, 10));
            long nights = ChronoUnit.DAYS.between(dIn, dOut);
            if (nights <= 0) nights = 1;

            booking.setNights((int) nights);

            if (booking.getRoomId() != null) {
                RoomEntity room = roomRepository.findById(booking.getRoomId()).orElse(null);
                if (room != null) {
                    double pricePerNight = (booking.getPricePerNight() != null && booking.getPricePerNight() > 0)
                            ? booking.getPricePerNight()
                            : (room.getPrice() != null ? room.getPrice() : 0.0);
                    double subtotal = (booking.getSubtotal() != null && booking.getSubtotal() > 0)
                            ? booking.getSubtotal()
                            : pricePerNight * nights;
                    booking.setPricePerNight(pricePerNight);
                    booking.setSubtotal(subtotal);

                    double serviceFee = (booking.getServiceFee() != null) ? booking.getServiceFee() : 0.0;
                    booking.setServiceFee(serviceFee);

                    if (booking.getTotal() == null || booking.getTotal() <= 0 || booking.getTotal() > (subtotal + serviceFee)) {
                        booking.setTotal(subtotal + serviceFee);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Không thể tính lại giá booking {}: {}", booking.getCode(), e.getMessage());
        }
    }

    @Transactional
    public BookingEntity updateBookingStatus(String code, String newStatus) {
        if (newStatus == null || newStatus.isBlank()) {
            throw new IllegalArgumentException("Trạng thái mới không được để trống");
        }
        BookingEntity b = getBookingByCode(code);
        b.setStatus(newStatus.trim().toUpperCase());
        return bookingRepository.save(b);
    }

    @Transactional
    public BookingEntity cancelBooking(String code) {
        BookingEntity b = getBookingByCode(code);
        if ("COMPLETED".equalsIgnoreCase(b.getStatus()) || "CANCELLED".equalsIgnoreCase(b.getStatus())) {
            throw new IllegalArgumentException("Không thể hủy đơn đặt phòng đã hoàn tất hoặc đã bị hủy trước đó");
        }
        b.setStatus("CANCELLED");
        return bookingRepository.save(b);
    }

    @Transactional
    public BookingEntity adminCancelBooking(String code, String reason) {
        BookingEntity b = getBookingByCode(code);
        b.setStatus("CANCELLED");
        BookingEntity saved = bookingRepository.save(b);
        String finalReason = reason != null && !reason.isBlank() ? reason : "Admin can thiệp hủy đơn";
        auditLogService.logAudit("CANCEL_BOOKING", code, "Admin can thiệp hủy đơn: " + finalReason, "admin");
        return saved;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getRevenueSummary(String ownerUsername) {
        List<BookingEntity> allBookings = bookingRepository.findAll();
        List<BookingEntity> scopedBookings = allBookings;

        if (ownerUsername != null && !ownerUsername.isBlank()) {
            Set<Long> ownerPropertyIds = propertyRepository.findByOwner(ownerUsername.trim()).stream()
                    .map(PropertyEntity::getId)
                    .collect(Collectors.toSet());
            scopedBookings = allBookings.stream()
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

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalBookings", scopedBookings.size());
        result.put("totalRevenue", totalRevenue);
        result.put("count", completedBookings.size());
        result.put("completedBookings", completedBookings);
        result.put("cancelledBookings", cancelledBookings);
        result.put("pendingBookings", pendingBookings);
        return result;
    }
}


