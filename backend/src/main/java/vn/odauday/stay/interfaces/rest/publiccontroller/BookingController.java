package vn.odauday.stay.interfaces.rest.publiccontroller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.odauday.stay.application.common.ApiResponse;
import vn.odauday.stay.application.model.booking.CreateBookingRequest;
import vn.odauday.stay.application.model.booking.UpdateBookingStatusRequest;
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
    @PreAuthorize("hasAnyRole('GUEST', 'HOST', 'ADMIN')")
    public ApiResponse<List<BookingEntity>> list(Authentication authentication) {
        return ApiResponse.ok(bookingService.listVisible(authentication.getName(), roleOf(authentication)));
    }

    @GetMapping("/{code}")
    @PreAuthorize("hasAnyRole('GUEST', 'HOST', 'ADMIN')")
    public ApiResponse<BookingEntity> get(@PathVariable String code, Authentication authentication) {
        return ApiResponse.ok(bookingService.getVisible(code, authentication.getName(), roleOf(authentication)));
    public ApiResponse<List<BookingEntity>> getBookings(@RequestParam(required = false) String guestUsername) {
        return ApiResponse.ok(bookingService.getBookings(guestUsername));
    }

    @GetMapping("/{code}")
    public ApiResponse<BookingEntity> getBookingByCode(@PathVariable String code) {
        return ApiResponse.ok(bookingService.getBookingByCode(code));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('GUEST')")
    public ApiResponse<BookingEntity> create(@RequestBody @Valid CreateBookingRequest request,
                                             Authentication authentication) {
        BookingEntity booking = bookingService.create(request, authentication.getName());
        return ApiResponse.ok("Đã tạo yêu cầu đặt phòng", booking);
    }

    @PostMapping("/{code}/cancel")
    @PreAuthorize("hasRole('GUEST')")
    public ApiResponse<BookingEntity> cancel(@PathVariable String code, Authentication authentication) {
        return ApiResponse.ok("Đã hủy đơn đặt phòng", bookingService.cancelByGuest(code, authentication.getName()));
    }

    @PatchMapping("/{code}/status")
    @PreAuthorize("hasRole('HOST')")
    public ApiResponse<BookingEntity> updateByHost(@PathVariable String code,
                                                   @RequestBody @Valid UpdateBookingStatusRequest request,
                                                   Authentication authentication) {
        return ApiResponse.ok("Đã cập nhật trạng thái đơn đặt phòng",
                bookingService.updateByHost(code, request.status(), authentication.getName()));
    }

    private String roleOf(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority().replaceFirst("^ROLE_", ""))
                .findFirst().orElse("");
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
