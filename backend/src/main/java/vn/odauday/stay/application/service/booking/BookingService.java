package vn.odauday.stay.application.service.booking;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.odauday.stay.application.service.audit.AuditLogService;
import vn.odauday.stay.domain.booking.model.BookingEntity;
import vn.odauday.stay.domain.booking.persistent.BookingRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final AuditLogService auditLogService;

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
        if (booking.getCode() == null || booking.getCode().isBlank()) {
            booking.setCode("ODD-" + LocalDateTime.now().getYear() + "-" + (int) (1000 + Math.random() * 9000));
        }
        if (booking.getCreatedAt() == null || booking.getCreatedAt().isBlank()) {
            booking.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        }
        BookingEntity saved = bookingRepository.save(booking);
        log.info("Booking created: {}", saved.getCode());
        return saved;
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
}

