package vn.odauday.stay.application.service.review;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.odauday.stay.application.model.review.CreateReviewRequest;
import vn.odauday.stay.application.model.review.ReviewResponse;
import vn.odauday.stay.domain.review.model.ReviewEntity;
import vn.odauday.stay.domain.review.persistent.ReviewRepository;

// Bạn hãy import PropertyEntity và PropertyRepository theo đúng cấu trúc thư mục của bạn nhé
import vn.odauday.stay.domain.property.model.PropertyEntity;
import vn.odauday.stay.domain.property.persistent.PropertyRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final PropertyRepository propertyRepository; // Inject thêm Repository của Property

    @Transactional
    public ReviewResponse createReview(String username, String fullName, CreateReviewRequest request) {
        // 1. Kiểm tra đơn đặt phòng
        if (reviewRepository.existsByBookingCode(request.getBookingCode())) {
            throw new IllegalStateException("Đơn đặt phòng này đã được đánh giá trước đó.");
        }

        // 2. Tạo Entity và lưu Review
        ReviewEntity review = ReviewEntity.builder()
                .bookingCode(request.getBookingCode())
                .propertyId(request.getPropertyId())
                .guestUsername(username)
                .guestName(fullName)
                .rating(request.getRating())
                .comment(request.getComment())
                .date(LocalDate.now().toString())
                .build();

        ReviewEntity savedReview = reviewRepository.save(review);

        // 3. TỰ ĐỘNG CẬP NHẬT ĐIỂM SỐ CHO PROPERTY
        updatePropertyRating(request.getPropertyId());

        // 4. Trả về Response
        return mapToResponse(savedReview);
    }

    // Tách riêng hàm cập nhật để code gọn gàng dễ đọc
    private void updatePropertyRating(Long propertyId) {
        try {
            // Lấy điểm trung bình và tổng số đánh giá từ Database
            Double avgRating = reviewRepository.calculateAverageRating(propertyId);
            int totalReviews = reviewRepository.countByPropertyId(propertyId);

            // Tìm Property trong DB
            PropertyEntity property = propertyRepository.findById(propertyId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chỗ ở ID: " + propertyId));

            // Làm tròn điểm số 2 chữ số thập phân (Ví dụ: 4.66667 -> 4.67)
            double roundedRating = avgRating != null ? Math.round(avgRating * 100.0) / 100.0 : 5.0;

            // Cập nhật Entity
            property.setRating(roundedRating);
            property.setReviewsCount(totalReviews);

            // Lưu lại vào bảng properties
            propertyRepository.save(property);

        } catch (Exception e) {
            // Dùng try-catch để nếu việc cập nhật điểm có lỗi cũng không làm gián đoạn luồng gửi đánh giá của khách
            System.err.println("Lỗi cập nhật điểm số Property: " + e.getMessage());
        }
    }

    private ReviewResponse mapToResponse(ReviewEntity review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .bookingCode(review.getBookingCode())
                .propertyId(review.getPropertyId())
                .guestUsername(review.getGuestUsername())
                .guestName(review.getGuestName())
                .rating(review.getRating())
                .comment(review.getComment())
                .date(review.getDate())
                .build();
    }
}