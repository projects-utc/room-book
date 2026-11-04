package vn.odauday.stay.application.service.review;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.odauday.stay.application.model.review.CreateReviewRequest;
import vn.odauday.stay.application.model.review.ReviewResponse;
import vn.odauday.stay.domain.booking.persistent.BookingRepository;
import vn.odauday.stay.domain.property.model.PropertyEntity;
import vn.odauday.stay.domain.property.persistent.PropertyRepository;
import vn.odauday.stay.domain.review.model.ReviewEntity;
import vn.odauday.stay.domain.review.persistent.ReviewRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final PropertyRepository propertyRepository; // Từ nhánh Tan_Phat
    private final BookingRepository bookingRepository;   // Từ nhánh master

    // Hàm lấy danh sách đánh giá (Giữ lại từ nhánh master)
    @Transactional(readOnly = true)
    public List<ReviewEntity> getReviews(Long propertyId) {
        if (propertyId != null) {
            return reviewRepository.findByPropertyId(propertyId);
        }
        return reviewRepository.findAll();
    }

    // Hàm tạo đánh giá kết hợp logic của cả Tan_Phat và master
    @Transactional
    public ReviewResponse createReview(String username, String fullName, CreateReviewRequest request) {
        // 1. Kiểm tra đơn đặt phòng
        if (reviewRepository.existsByBookingCode(request.getBookingCode())) {
            throw new IllegalStateException("Đơn đặt phòng này đã được đánh giá trước đó.");
        }

        // 2. Tạo Entity và lưu Review (Lấy format ngày dd/MM/yyyy từ nhánh master)
        String currentDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        ReviewEntity review = ReviewEntity.builder()
                .bookingCode(request.getBookingCode())
                .propertyId(request.getPropertyId())
                .guestUsername(username)
                .guestName(fullName)
                .rating(request.getRating())
                .comment(request.getComment())
                .date(currentDate)
                .build();

        ReviewEntity savedReview = reviewRepository.save(review);

        // 3. TỰ ĐỘNG CẬP NHẬT ĐIỂM SỐ CHO PROPERTY (Logic của nhánh Tan_Phat)
        updatePropertyRating(request.getPropertyId());

        // 4. ĐÁNH DẤU ĐƠN ĐẶT PHÒNG LÀ ĐÃ ĐÁNH GIÁ (Logic của nhánh master)
        if (request.getBookingCode() != null && !request.getBookingCode().isBlank()) {
            bookingRepository.findByCode(request.getBookingCode()).ifPresent(b -> {
                b.setIsReviewed(true);
                bookingRepository.save(b);
            });
        }

        // 5. Trả về Response
        return mapToResponse(savedReview);
    }

    // Logic tính và cập nhật điểm trung bình (Từ nhánh Tan_Phat)
    private void updatePropertyRating(Long propertyId) {
        try {
            Double avgRating = reviewRepository.calculateAverageRating(propertyId);
            int totalReviews = reviewRepository.countByPropertyId(propertyId);

            PropertyEntity property = propertyRepository.findById(propertyId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chỗ ở ID: " + propertyId));

            double roundedRating = avgRating != null ? Math.round(avgRating * 100.0) / 100.0 : 5.0;

            property.setRating(roundedRating);
            property.setReviewsCount(totalReviews);

            propertyRepository.save(property);

        } catch (Exception e) {
            log.error("Lỗi cập nhật điểm số Property: {}", e.getMessage());
        }
    }

    // Mapper (Từ nhánh Tan_Phat)
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