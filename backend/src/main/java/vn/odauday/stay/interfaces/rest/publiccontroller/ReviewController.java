package vn.odauday.stay.interfaces.rest.publiccontroller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.odauday.stay.application.common.ApiResponse;
import vn.odauday.stay.application.model.review.CreateReviewRequest;
import vn.odauday.stay.application.model.review.ReviewResponse;
import vn.odauday.stay.application.model.user.UserResponse;
import vn.odauday.stay.application.service.review.ReviewService;
import vn.odauday.stay.application.service.user.AuthService;
import vn.odauday.stay.domain.booking.persistent.BookingRepository;
import vn.odauday.stay.domain.review.model.ReviewEntity;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final AuthService authService;
    private final BookingRepository bookingRepository;

    @GetMapping
    public ApiResponse<List<ReviewEntity>> getReviews(@RequestParam(required = false) Long propertyId) {
        return ApiResponse.ok(reviewService.getReviews(propertyId));
    }

    @GetMapping("/property/{propertyId}")
    public ApiResponse<List<ReviewEntity>> getReviewsByProperty(@PathVariable Long propertyId) {
        return ApiResponse.ok(reviewService.getReviews(propertyId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ReviewResponse> createReview(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody CreateReviewRequest request) {

        String resolvedUsername = "guest_user";
        String resolvedFullName = "Khách Hàng Ẩn Danh";

        // 1. Xác thực người dùng qua JWT Bearer Token (chuẩn bảo mật)
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            try {
                UserResponse user = authService.getMe(authHeader);
                if (user != null) {
                    if (StringUtils.hasText(user.getUsername())) resolvedUsername = user.getUsername();
                    if (StringUtils.hasText(user.getFullName())) resolvedFullName = user.getFullName();
                }
            } catch (Exception e) {
                log.debug("Không thể trích xuất người dùng từ JWT token: {}", e.getMessage());
            }
        }

        // 2. Fallback: lấy từ thông tin request body nếu chưa xác thực qua JWT
        if ("guest_user".equals(resolvedUsername)) {
            if (StringUtils.hasText(request.getGuestUsername())) {
                resolvedUsername = request.getGuestUsername();
            }
            if (StringUtils.hasText(request.getGuestName())) {
                resolvedFullName = request.getGuestName();
            }
        }

        // 3. Fallback: lấy từ thông tin người đặt trong booking
        if ("guest_user".equals(resolvedUsername) && StringUtils.hasText(request.getBookingCode())) {
            var optBooking = bookingRepository.findByCode(request.getBookingCode());
            if (optBooking.isPresent()) {
                var booking = optBooking.get();
                if (StringUtils.hasText(booking.getGuestUsername())) {
                    resolvedUsername = booking.getGuestUsername();
                }
                if (StringUtils.hasText(booking.getGuestName())) {
                    resolvedFullName = booking.getGuestName();
                }
            }
        }

        ReviewResponse response = reviewService.createReview(resolvedUsername, resolvedFullName, request);
        return ApiResponse.ok("Đánh giá thành công!", response);
    }
}
