package vn.odauday.stay.domain.property.persistent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.odauday.stay.domain.property.model.PropertyEntity;

import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<PropertyEntity, Long> {
    List<PropertyEntity> findByOwner(String owner);
    List<PropertyEntity> findByStatus(String status);
    List<PropertyEntity> findByStatusAndIsHotTrue(String status);

    /**
     * Lấy danh sách lượt xem 7 ngày qua của các phòng đang hoạt động (sắp xếp giảm dần)
     * Dùng để xác định ngưỡng Top 10% lượt xem (Điều kiện B)
     */
    @Query("SELECT p.views7d FROM PropertyEntity p WHERE p.status = 'ACTIVE' AND p.views7d IS NOT NULL AND p.views7d > 0 ORDER BY p.views7d DESC")
    List<Long> findActiveViews7dDesc();

    /**
     * Native SQL Query: Lấy trực tiếp danh sách các phòng HOT theo cả 3 điều kiện Time-bound:
     * - Điều kiện A: Có >= minBookings đơn (status != 'CANCELLED') trong vòng 30 ngày (từ thirtyDaysAgo)
     * - Điều kiện B: Nằm trong Top 10% phòng có lượt xem (views_7d) cao nhất 7 ngày qua (PERCENT_RANK <= 0.10)
     * - Điều kiện C: Cờ is_hot = 1 do Admin set cứng trong Database
     */
    @Query(value = """
        WITH RankedViews AS (
            SELECT p.id,
                   PERCENT_RANK() OVER (ORDER BY COALESCE(p.views_7d, 0) DESC) AS view_pct
            FROM properties p
            WHERE p.status = 'ACTIVE' AND COALESCE(p.views_7d, 0) > 0
        ),
        RecentHotBookings AS (
            SELECT b.property_id, COUNT(b.id) AS total_recent_bookings
            FROM bookings b
            WHERE (b.booking_status IS NULL OR b.booking_status != 'CANCELLED')
              AND b.created_at_str >= :thirtyDaysAgo
            GROUP BY b.property_id
            HAVING COUNT(b.id) >= :minBookings
        )
        SELECT DISTINCT p.*
        FROM properties p
        LEFT JOIN RankedViews rv ON p.id = rv.id
        LEFT JOIN RecentHotBookings rhb ON p.id = rhb.property_id
        WHERE p.status = 'ACTIVE'
          AND (
              -- Điều kiện C: Admin set cứng
              p.is_hot = 1
              -- Điều kiện A: Có >= minBookings đơn trong 30 ngày gần nhất
              OR rhb.property_id IS NOT NULL
              -- Điều kiện B: Top 10% lượt xem trong 7 ngày qua
              OR (rv.view_pct IS NOT NULL AND rv.view_pct <= 0.10)
          )
        ORDER BY p.id ASC
        """, nativeQuery = true)
    List<PropertyEntity> findHotPropertiesNative(
            @Param("thirtyDaysAgo") String thirtyDaysAgo,
            @Param("minBookings") long minBookings
    );
}
