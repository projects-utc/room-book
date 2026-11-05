package vn.odauday.stay.interfaces.rest.publiccontroller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.odauday.stay.application.common.ApiResponse;
import vn.odauday.stay.application.service.booking.BookingService;
import vn.odauday.stay.domain.booking.model.BookingEntity;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    @GetMapping
    public ApiResponse<List<BookingEntity>> getBookings(@RequestParam(required = false) String guestUsername) {
        return ApiResponse.ok(bookingService.getBookings(guestUsername));
    }

    @GetMapping("/{code}")
    public ApiResponse<BookingEntity> getBookingByCode(@PathVariable String code) {
        return ApiResponse.ok(bookingService.getBookingByCode(code));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BookingEntity> createBooking(@RequestBody BookingEntity booking) {
        return ApiResponse.ok("Đặt phòng thành công", bookingService.createBooking(booking));
    }

    @PatchMapping("/{code}/status")
    public ApiResponse<BookingEntity> updateBookingStatus(@PathVariable String code, @RequestBody Map<String, String> body) {
        return ApiResponse.ok("Đã cập nhật trạng thái đơn đặt phòng", bookingService.updateBookingStatus(code, body.get("status")));
    }

    @PostMapping("/{code}/cancel")
    public ApiResponse<BookingEntity> cancelBooking(@PathVariable String code) {
        return ApiResponse.ok("Đã hủy đơn đặt phòng", bookingService.cancelBooking(code));
    }

    @PostMapping("/{code}/admin-cancel")
    public ApiResponse<BookingEntity> adminCancelBooking(@PathVariable String code, @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ApiResponse.ok("Đã can thiệp hủy đơn đặt phòng", bookingService.adminCancelBooking(code, reason));
    }
}
