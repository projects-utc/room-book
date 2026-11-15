package vn.odauday.stay.interfaces.rest.publiccontroller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.odauday.stay.application.common.ApiResponse;
import vn.odauday.stay.application.service.room.RoomService;
import vn.odauday.stay.domain.room.model.RoomBlockEntity;
import vn.odauday.stay.domain.room.model.RoomEntity;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class RoomController {

    private final RoomService roomService;

    // region Rooms
    @GetMapping("/rooms")
    public ApiResponse<List<RoomEntity>> getRooms(@RequestParam(required = false) Long propertyId) {
        return ApiResponse.ok(roomService.getRooms(propertyId));
    }

    @PostMapping("/rooms")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RoomEntity> createRoom(@RequestBody RoomEntity room) {
        return ApiResponse.ok("Đã tạo phòng thành công", roomService.createRoom(room));
    }

    @DeleteMapping("/rooms/{id}")
    public ApiResponse<Void> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ApiResponse.ok("Đã xóa phòng", null);
    }
    // endregion

    // region Room Blocks
    @GetMapping("/room-blocks")
    public ApiResponse<List<RoomBlockEntity>> getRoomBlocks(@RequestParam(required = false) Long roomId) {
        return ApiResponse.ok(roomService.getRoomBlocks(roomId));
    }

    @PostMapping("/room-blocks")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RoomBlockEntity> createRoomBlock(@RequestBody RoomBlockEntity block) {
        return ApiResponse.ok("Đã tạo lịch khóa phòng", roomService.createRoomBlock(block));
    }

    @DeleteMapping("/room-blocks/{id}")
    public ApiResponse<Void> deleteRoomBlock(@PathVariable Long id) {
        roomService.deleteRoomBlock(id);
        return ApiResponse.ok("Đã xóa lịch khóa phòng", null);
    }
    // endregion
}
