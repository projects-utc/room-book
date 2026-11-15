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
    private final PropertyRepository propertyRepository;
    private final BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    public List<ReviewEntity> getReviews(Long propertyId) {
        if (propertyId != null) {
            return reviewRepository.findByPropertyId(propertyId);
        }
        return reviewRepository.findAll();
    }

    @Transactional
    public ReviewResponse createReview(String username, String fullName, CreateReviewRequest request) {
        if (reviewRepository.existsByBookingCode(request.getBookingCode())) {
            throw new IllegalStateException("Đơn đặt phòng này đã được đánh giá trước đó.");
        }

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

        // Tự động tính toán và cập nhật điểm số Property
        updatePropertyRating(request.getPropertyId());

        if (request.getBookingCode() != null && !request.getBookingCode().isBlank()) {
            bookingRepository.findByCode(request.getBookingCode()).ifPresent(b -> {
                b.setIsReviewed(true);
                bookingRepository.save(b);
            });
        }

        return mapToResponse(savedReview);
    }

    @Transactional
    public ReviewEntity submitReview(ReviewEntity review) {
        if (review.getDate() == null || review.getDate().isBlank()) {
            review.setDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        }
        ReviewEntity saved = reviewRepository.save(review);

        // Cập nhật điểm property nếu có propertyId
        if (review.getPropertyId() != null) {
            updatePropertyRating(review.getPropertyId());
        }

        if (review.getBookingCode() != null && !review.getBookingCode().isBlank()) {
            bookingRepository.findByCode(review.getBookingCode()).ifPresent(b -> {
                b.setIsReviewed(true);
                bookingRepository.save(b);
            });
        }
        return saved;
    }

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