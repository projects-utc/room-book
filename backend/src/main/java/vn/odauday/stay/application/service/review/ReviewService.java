package vn.odauday.stay.application.service.review;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.odauday.stay.domain.booking.persistent.BookingRepository;
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
    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;

    @Transactional(readOnly = true)
    public List<ReviewEntity> getReviews(Long propertyId) {
        if (propertyId != null) {
            return reviewRepository.findByPropertyId(propertyId);
        }
        return reviewRepository.findAll();
    }

    @Transactional
    public ReviewEntity submitReview(ReviewEntity review) {
        if (review.getDate() == null || review.getDate().isBlank()) {
            review.setDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        }
        ReviewEntity saved = reviewRepository.save(review);
        if (review.getBookingCode() != null && !review.getBookingCode().isBlank()) {
            bookingRepository.findByCode(review.getBookingCode()).ifPresent(b -> {
                b.setIsReviewed(true);
                bookingRepository.save(b);
            });
        }
        if (review.getPropertyId() != null) {
            propertyRepository.findById(review.getPropertyId()).ifPresent(p -> {
                List<ReviewEntity> revs = reviewRepository.findByPropertyId(review.getPropertyId());
                double avg = revs.stream()
                        .filter(r -> r.getRating() != null)
                        .mapToInt(ReviewEntity::getRating)
                        .average()
                        .orElse(5.0);
                p.setRating(Math.round(avg * 10.0) / 10.0);
                p.setReviewsCount(revs.size());
                propertyRepository.save(p);
            });
        }
        return saved;
    }
}

