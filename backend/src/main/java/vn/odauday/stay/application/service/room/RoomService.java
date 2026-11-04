package vn.odauday.stay.application.service.room;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.odauday.stay.domain.room.model.RoomBlockEntity;
import vn.odauday.stay.domain.room.model.RoomEntity;
import vn.odauday.stay.domain.room.persistent.RoomBlockRepository;
import vn.odauday.stay.domain.room.persistent.RoomRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomBlockRepository roomBlockRepository;

    @Transactional(readOnly = true)
    public List<RoomEntity> getRooms(Long propertyId) {
        if (propertyId != null) {
            return roomRepository.findByPropertyId(propertyId);
        }
        return roomRepository.findAll();
    }

    @Transactional
    public RoomEntity createRoom(RoomEntity room) {
        return roomRepository.save(room);
    }

    @Transactional
    public void deleteRoom(Long id) {
        roomRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<RoomBlockEntity> getRoomBlocks(Long roomId) {
        if (roomId != null) {
            return roomBlockRepository.findByRoomId(roomId);
        }
        return roomBlockRepository.findAll();
    }

    @Transactional
    public RoomBlockEntity createRoomBlock(RoomBlockEntity block) {
        return roomBlockRepository.save(block);
    }

    @Transactional
    public void deleteRoomBlock(Long id) {
        roomBlockRepository.deleteById(id);
    }
}

