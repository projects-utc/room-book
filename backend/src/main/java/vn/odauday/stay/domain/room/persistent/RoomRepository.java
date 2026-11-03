package vn.odauday.stay.domain.room.persistent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.odauday.stay.domain.room.model.RoomEntity;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<RoomEntity, Long> {
    List<RoomEntity> findByPropertyId(Long propertyId);
}
