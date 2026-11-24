package vn.odauday.stay.application.service.room;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.odauday.stay.domain.booking.persistent.BookingRepository;
import vn.odauday.stay.domain.room.model.RoomBlockEntity;
import vn.odauday.stay.domain.room.model.RoomEntity;
import vn.odauday.stay.domain.room.persistent.RoomBlockRepository;
import vn.odauday.stay.domain.room.persistent.RoomRepository;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomBlockRepository roomBlockRepository;
    private final BookingRepository bookingRepository;

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
        roomRepository.findById(id).ifPresent(r -> {
            boolean hasActiveBooking = bookingRepository.findAll().stream()
                    .anyMatch(b -> id.equals(b.getRoomId())
                            && b.getStatus() != null
                            && List.of("PENDING", "CONFIRMED", "CHECKED_IN").contains(b.getStatus().toUpperCase()));
            if (hasActiveBooking) {
                throw new IllegalStateException("Không thể xóa phòng đang có đơn đặt phòng hoạt động");
            }
            roomBlockRepository.deleteAll(roomBlockRepository.findByRoomId(id));
            roomRepository.delete(r);
        });
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
        if (block.getRoomId() == null) {
            throw new IllegalArgumentException("Phòng khóa (roomId) không được để trống");
        }
        if (block.getStart() == null || block.getStart().isBlank() || block.getEnd() == null || block.getEnd().isBlank()) {
            throw new IllegalArgumentException("Ngày bắt đầu và kết thúc khóa phòng không được để trống");
        }
        String startStr;
        String endStr;
        try {
            LocalDate startDate = LocalDate.parse(block.getStart().trim().substring(0, Math.min(10, block.getStart().trim().length())));
            LocalDate endDate = LocalDate.parse(block.getEnd().trim().substring(0, Math.min(10, block.getEnd().trim().length())));
            if (!endDate.isAfter(startDate)) {
                throw new IllegalArgumentException("Ngày kết thúc khóa phòng phải sau ngày bắt đầu");
            }
            startStr = startDate.toString();
            endStr = endDate.toString();
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Định dạng ngày không hợp lệ, yêu cầu định dạng YYYY-MM-DD");
        }

        if (!bookingRepository.findOverlappingBookings(block.getRoomId(), startStr, endStr).isEmpty()) {
            throw new IllegalArgumentException("Không thể tạo lịch khóa phòng vì đã có đơn đặt phòng trong khoảng thời gian này");
        }
        if (!roomBlockRepository.findOverlappingBlocks(block.getRoomId(), startStr, endStr).isEmpty()) {
            throw new IllegalArgumentException("Khoảng thời gian này đã có lịch khóa phòng trước đó");
        }

        block.setStart(startStr);
        block.setEnd(endStr);
        return roomBlockRepository.save(block);
    }

    @Transactional
    public void deleteRoomBlock(Long id) {
        roomBlockRepository.deleteById(id);
    }
}

