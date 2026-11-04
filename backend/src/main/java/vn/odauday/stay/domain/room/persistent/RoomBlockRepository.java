package vn.odauday.stay.domain.room.persistent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.odauday.stay.domain.room.model.RoomBlockEntity;

import java.util.List;

@Repository
public interface RoomBlockRepository extends JpaRepository<RoomBlockEntity, Long> {
    List<RoomBlockEntity> findByRoomId(Long roomId);
}
