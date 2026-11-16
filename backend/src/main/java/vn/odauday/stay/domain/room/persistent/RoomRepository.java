package vn.odauday.stay.domain.room.persistent;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.odauday.stay.domain.room.model.RoomEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<RoomEntity, Long> {
    List<RoomEntity> findByPropertyId(Long propertyId);

    /**
     * SELECT ... FOR UPDATE trên dòng phòng. Giao dịch đặt phòng thứ hai cho cùng phòng sẽ phải chờ
     * giao dịch thứ nhất commit rồi mới kiểm tra trùng lịch, nên không thể cùng lúc thấy "phòng trống".
     * Chỉ gọi trong phương thức @Transactional.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM RoomEntity r WHERE r.id = :id")
    Optional<RoomEntity> findByIdForUpdate(@Param("id") Long id);
}
