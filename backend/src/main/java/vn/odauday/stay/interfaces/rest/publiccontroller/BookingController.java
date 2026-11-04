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
import vn.odauday.stay.application.service.booking.BookingService;
import vn.odauday.stay.domain.booking.model.BookingEntity;

import java.util.List;

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
    }
}
