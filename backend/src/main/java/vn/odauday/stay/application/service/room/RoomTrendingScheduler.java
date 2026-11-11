package vn.odauday.stay.application.service.room;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.odauday.stay.application.service.property.PropertyService;
import vn.odauday.stay.domain.property.model.PropertyEntity;
import vn.odauday.stay.domain.property.persistent.PropertyRepository;

import java.util.List;

/**
 * Scheduled Job cập nhật trạng thái Trending (Phòng Hot) tự động định kỳ vào Database
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RoomTrendingScheduler {

    private final PropertyService propertyService;
    private final PropertyRepository propertyRepository;

    /**
     * Chạy định kỳ mỗi 15 phút (900,000 ms)
     * Đồng bộ đầy đủ cả 3 điều kiện:
     * - Điều kiện A: Số lượt đặt phòng (bookings) >= 5 trong vòng 30 ngày qua
     * - Điều kiện B: Nằm trong Top 10% phòng có lượt xem (views_7d) cao nhất
     * - Điều kiện C: Cờ isHot do Admin gán trực tiếp
     */
    @Scheduled(fixedRate = 900000)
    @Transactional
    public void updateTrendingRooms() {
        log.info("[RoomTrendingScheduler] Bắt đầu quét và cập nhật trạng thái Trending...");

        try {
            List<PropertyEntity> allProperties = propertyRepository.findAll();
            propertyService.enrichHotAndTrending(allProperties);
            propertyRepository.saveAll(allProperties);

            long trendingCount = allProperties.stream()
                    .filter(p -> Boolean.TRUE.equals(p.getIsTrending()))
                    .count();

            log.info("[RoomTrendingScheduler] Đã cập nhật thành công: {} phòng Trending trên tổng số {} phòng vào Database.", 
                     trendingCount, allProperties.size());
        } catch (Exception e) {
            log.error("[RoomTrendingScheduler] Lỗi khi cập nhật trạng thái Trending: {}", e.getMessage(), e);
        }
    }
}

