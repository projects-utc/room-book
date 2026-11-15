package vn.odauday.stay.application.service.booking;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.odauday.stay.application.service.audit.AuditLogService;
import vn.odauday.stay.domain.booking.model.BookingEntity;
import vn.odauday.stay.domain.booking.persistent.BookingRepository;
import vn.odauday.stay.domain.room.model.RoomEntity;
import vn.odauday.stay.domain.room.persistent.RoomRepository;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final AuditLogService auditLogService;
    private final RoomRepository roomRepository;

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
        // Tự động sinh code nếu chưa có
        if (booking.getCode() == null || booking.getCode().isBlank()) {
            booking.setCode("ODD-" + LocalDateTime.now().getYear() + "-" + (int) (1000 + Math.random() * 9000));
        }
        if (booking.getCreatedAt() == null || booking.getCreatedAt().isBlank()) {
            booking.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        }

        // Kiểm tra sức chứa phòng và trùng lịch
        if (booking.getRoomId() != null) {
            RoomEntity room = roomRepository.findById(booking.getRoomId()).orElse(null);
            if (room != null && room.getCapacity() != null && booking.getGuests() != null) {
                if (booking.getGuests() > room.getCapacity()) {
                    throw new IllegalArgumentException("Số lượng khách (" + booking.getGuests() + ") vượt quá sức chứa tối đa của phòng (" + room.getCapacity() + " người).");
                }
            }
            if (booking.getCheckIn() != null && booking.getCheckOut() != null) {
                String newIn = booking.getCheckIn().trim().substring(0, Math.min(10, booking.getCheckIn().trim().length()));
                String newOut = booking.getCheckOut().trim().substring(0, Math.min(10, booking.getCheckOut().trim().length()));
                List<BookingEntity> existing = bookingRepository.findByRoomId(booking.getRoomId());
                if (existing.isEmpty() && booking.getPropertyId() != null) {
                    List<RoomEntity> roomsOfProp = roomRepository.findByPropertyId(booking.getPropertyId());
                    if (roomsOfProp.size() <= 1) {
                        existing = bookingRepository.findByPropertyId(booking.getPropertyId());
                    }
                }
                for (BookingEntity b : existing) {
                    if (b.getStatus() != null && !List.of("CANCELLED", "REJECTED").contains(b.getStatus().toUpperCase())) {
                        if (b.getCheckIn() != null && b.getCheckOut() != null) {
                            String existIn = b.getCheckIn().trim().substring(0, Math.min(10, b.getCheckIn().trim().length()));
                            String existOut = b.getCheckOut().trim().substring(0, Math.min(10, b.getCheckOut().trim().length()));
                            if (newIn.compareTo(existOut) < 0 && newOut.compareTo(existIn) > 0) {
                                throw new IllegalStateException("Phòng đã có khách đặt trong khoảng ngày " + existIn + " đến " + existOut + ".");
                            }
                        }
                    }
                }
            }
        }

        // Tính lại nights, subtotal, total từ DB để đảm bảo đúng (không tin hoàn toàn vào FE)
        recalculatePricing(booking);

        BookingEntity saved = bookingRepository.save(booking);
        log.info("Booking created: {} | nights={} | total={}", saved.getCode(), saved.getNights(), saved.getTotal());
        return saved;
    }

    /**
     * Tính lại số đêm và tổng tiền dựa trên giá phòng thực tế từ DB.
     * - Nếu FE truyền nights/total hợp lệ và khớp với DB → giữ nguyên.
     * - Nếu không → ghi đè bằng giá tính từ DB.
     */
    private void recalculatePricing(BookingEntity booking) {
        try {
            if (booking.getCheckIn() == null || booking.getCheckOut() == null) return;
            LocalDate dIn  = LocalDate.parse(booking.getCheckIn().trim().substring(0, 10));
            LocalDate dOut = LocalDate.parse(booking.getCheckOut().trim().substring(0, 10));
            long nights = ChronoUnit.DAYS.between(dIn, dOut);
            if (nights <= 0) nights = 1;

            booking.setNights((int) nights);

            // Lấy giá phòng từ DB
            if (booking.getRoomId() != null) {
                RoomEntity room = roomRepository.findById(booking.getRoomId()).orElse(null);
                if (room != null) {
                    double pricePerNight = (room.getPrice() != null) ? room.getPrice() : 0.0;
                    double subtotal = pricePerNight * nights;
                    booking.setPricePerNight(pricePerNight);
                    booking.setSubtotal(subtotal);

                    double serviceFee = (booking.getServiceFee() != null) ? booking.getServiceFee() : 0.0;
                    booking.setServiceFee(serviceFee);

                    // Nếu FE đã truyền total hợp lệ (có thể đã áp dụng mã Voucher / Khuyến mại),
                    // ưu tiên giữ nguyên số tiền đã giảm giá từ FE để không ghi đè làm mất voucher khi lưu vào Database.
                    // Chỉ tính lại total = subtotal + serviceFee khi FE không truyền, total <= 0,
                    // hoặc total > subtotal + serviceFee (không hợp lệ vì voucher không làm tăng giá).
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

