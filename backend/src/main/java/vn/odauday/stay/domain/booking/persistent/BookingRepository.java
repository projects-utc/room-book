package vn.odauday.stay.domain.booking.persistent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.odauday.stay.domain.booking.model.BookingEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<BookingEntity, Long> {
    Optional<BookingEntity> findByCode(String code);
    List<BookingEntity> findByGuestUsername(String guestUsername);

    /**
     * Điều kiện A: Tìm các propertyId có số lượt đặt phòng >= minBookings trong vòng số ngày gần nhất (startDate)
     * Loại trừ các đơn bị CANCELLED.
     */
    @Query("SELECT b.propertyId FROM BookingEntity b " +
           "WHERE (b.status IS NULL OR b.status != 'CANCELLED') " +
           "AND b.createdAt >= :startDate " +
           "GROUP BY b.propertyId " +
           "HAVING COUNT(b) >= :minBookings")
    List<Long> findHotPropertyIdsByRecentBookings(
            @Param("startDate") String startDate,
            @Param("minBookings") long minBookings
    );

    @Query("SELECT b FROM BookingEntity b WHERE b.roomId = :roomId " +
           "AND b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN') " +
           "AND b.checkIn < :checkOut AND b.checkOut > :checkIn")
    List<BookingEntity> findOverlappingBookings(
            @Param("roomId") Long roomId,
            @Param("checkIn") String checkIn,
            @Param("checkOut") String checkOut);
}

