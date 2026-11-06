package vn.odauday.stay.interfaces.rest.admincontroller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.odauday.stay.application.common.ApiResponse;
import vn.odauday.stay.application.model.booking.UpdateBookingStatusRequest;
import vn.odauday.stay.application.service.booking.BookingService;
import vn.odauday.stay.domain.booking.model.BookingEntity;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/bookings")
@PreAuthorize("hasRole('ADMIN')")
public class AdminBookingController {

    private final BookingService bookingService;

    @GetMapping
    public ApiResponse<List<BookingEntity>> list() {
        return ApiResponse.ok(bookingService.listVisible("", "ADMIN"));
    }

    @PatchMapping("/{code}/status")
    public ApiResponse<BookingEntity> updateStatus(@PathVariable String code,
                                                   @RequestBody @Valid UpdateBookingStatusRequest request,
                                                   Authentication authentication) {
        return ApiResponse.ok("Đã cập nhật trạng thái đơn đặt phòng",
                bookingService.updateByAdmin(code, request.status(), authentication.getName(), request.reason()));
    }

    @PostMapping("/{code}/cancel")
    public ApiResponse<BookingEntity> cancel(@PathVariable String code,
                                             @RequestBody(required = false) UpdateBookingStatusRequest request,
                                             Authentication authentication) {
        String reason = request == null ? null : request.reason();
        return ApiResponse.ok("Đã can thiệp hủy đơn đặt phòng",
                bookingService.cancelByAdmin(code, authentication.getName(), reason));
    }
}
