package vn.odauday.stay.domain.room.persistent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.odauday.stay.domain.room.model.RoomBlockEntity;

import java.util.List;

@Repository
public interface RoomBlockRepository extends JpaRepository<RoomBlockEntity, Long> {
    List<RoomBlockEntity> findByRoomId(Long roomId);

    @Query("SELECT rb FROM RoomBlockEntity rb WHERE rb.roomId = :roomId " +
           "AND rb.start < :end AND rb.end > :start")
    List<RoomBlockEntity> findOverlappingBlocks(
            @Param("roomId") Long roomId,
            @Param("start") String start,
            @Param("end") String end);
}
