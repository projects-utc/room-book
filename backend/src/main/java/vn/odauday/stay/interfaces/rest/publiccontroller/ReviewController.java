package vn.odauday.stay.interfaces.rest.publiccontroller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.odauday.stay.application.common.ApiResponse;
import vn.odauday.stay.application.service.review.ReviewService;
import vn.odauday.stay.domain.review.model.ReviewEntity;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ApiResponse<List<ReviewEntity>> getReviews(@RequestParam(required = false) Long propertyId) {
        return ApiResponse.ok(reviewService.getReviews(propertyId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ReviewEntity> submitReview(@RequestBody ReviewEntity review) {
        return ApiResponse.ok("Đã gửi đánh giá thành công", reviewService.submitReview(review));
    }
}
