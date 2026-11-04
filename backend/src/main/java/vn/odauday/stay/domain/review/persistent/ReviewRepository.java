package vn.odauday.stay.domain.review.persistent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.odauday.stay.domain.review.model.ReviewEntity;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {
    List<ReviewEntity> findByPropertyId(Long propertyId);

    List<ReviewEntity> findByBookingCode(String bookingCode);

    boolean existsByBookingCode(String bookingCode);

    // THÊM 2 HÀM MỚI DƯỚI ĐÂY:
    // Đếm tổng số lượng đánh giá của 1 Property
    int countByPropertyId(Long propertyId);

    // Dùng JPQL để nhờ Database tính điểm trung bình (AVG)
    @Query("SELECT AVG(r.rating) FROM ReviewEntity r WHERE r.propertyId = :propertyId")
    Double calculateAverageRating(@Param("propertyId") Long propertyId);
}