package vn.odauday.stay.domain.review.persistent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.odauday.stay.domain.review.model.ReviewEntity;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {
    List<ReviewEntity> findByPropertyId(Long propertyId);
    List<ReviewEntity> findByBookingCode(String bookingCode);
}
