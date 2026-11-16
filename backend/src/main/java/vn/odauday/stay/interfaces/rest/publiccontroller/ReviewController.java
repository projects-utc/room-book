package vn.odauday.stay.interfaces.rest.publiccontroller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
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
import vn.odauday.stay.application.common.CurrentUser;
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

    /**
     * Danh tính người đánh giá lấy từ JWT (SecurityConfig đã bắt buộc đăng nhập),
     * không đọc guestUsername/guestName từ body.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ReviewResponse> createReview(
            @RequestHeader("Authorization") String authHeader,
            Authentication authentication,
            @Valid @RequestBody CreateReviewRequest request) {

        CurrentUser current = CurrentUser.from(authentication);
        UserResponse user = authService.getMe(authHeader);

        bookingRepository.findByCode(request.getBookingCode().trim()).ifPresent(booking -> {
            if (!current.username().equals(booking.getGuestUsername())) {
                throw new AccessDeniedException("Bạn chỉ được đánh giá đơn đặt phòng của chính mình");
            }
        });

        ReviewResponse response = reviewService.createReview(current.username(), user.getFullName(), request);
        return ApiResponse.ok("Đánh giá thành công!", response);
    }
}
