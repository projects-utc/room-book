package vn.odauday.stay.interfaces.rest.review;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.odauday.stay.application.model.review.CreateReviewRequest;
import vn.odauday.stay.application.model.review.ReviewResponse;
import vn.odauday.stay.application.service.review.ReviewService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Mở CORS để Frontend (React) có thể gọi được API
public class ReviewController {

    private final ReviewService reviewService;

    // API 1: Tạo đánh giá mới (POST /api/reviews)
    @PostMapping
    public ResponseEntity<?> createReview(@Valid @RequestBody CreateReviewRequest request) {
        try {
            // Tạm thời fix cứng username, sau này dự án hoàn thiện auth sẽ lấy từ Token (JWT)
            String username = "guest_user";
            String fullName = "Đoàn Tấn Phát";

            ReviewResponse response = reviewService.createReview(username, fullName, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "success", true,
                    "message", "Đánh giá thành công!",
                    "data", response
            ));
        } catch (IllegalStateException | IllegalArgumentException e) {
            // Xử lý lỗi nếu khách hàng đã đánh giá đơn này rồi hoặc dữ liệu không hợp lệ
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            // Xử lý các lỗi hệ thống khác
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Lỗi hệ thống: " + e.getMessage()
            ));
        }
    }

    // API 2: Lấy danh sách đánh giá của 1 chỗ ở để hiển thị lên UI (GET /api/reviews/property/{propertyId})
    @GetMapping("/property/{propertyId}")
    public ResponseEntity<?> getReviewsByProperty(@PathVariable Long propertyId) {
        List<ReviewResponse> reviews = reviewService.getReviewsByProperty(propertyId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", reviews
        ));
    }
}