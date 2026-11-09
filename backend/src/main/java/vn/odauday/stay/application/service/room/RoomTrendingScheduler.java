package vn.odauday.stay.application.service.room;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.odauday.stay.domain.booking.persistent.BookingRepository;
import vn.odauday.stay.domain.property.model.PropertyEntity;
import vn.odauday.stay.domain.property.persistent.PropertyRepository;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Scheduled Job cập nhật trạng thái Trending (Phòng Hot) tự động định kỳ
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RoomTrendingScheduler {

    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;

    /**
     * Chạy định kỳ mỗi 15 phút (900,000 ms)
     * Điều kiện: Số lượt đặt phòng (bookings) > 5 trong vòng 30 ngày qua
     * - Nếu thỏa mãn -> isTrending = true
     * - Các phòng còn lại -> isTrending = false
     */
    @Scheduled(fixedRate = 900000)
    @Transactional
    public void updateTrendingRooms() {
        log.info("[RoomTrendingScheduler] Bắt đầu quét và cập nhật trạng thái Trending...");

        try {
            // 1. Lấy mốc thời gian 30 ngày gần nhất (định dạng yyyy-MM-dd)
            String thirtyDaysAgo = LocalDate.now().minusDays(30).format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

            // 2. Tìm tất cả các phòng/chỗ ở có số lượt đặt (bookings) > 5 trong 30 ngày qua
            List<Long> trendingIds = bookingRepository.findTrendingPropertyIds(thirtyDaysAgo, 5L);
            Set<Long> trendingSet = new HashSet<>(trendingIds != null ? trendingIds : List.of());

            // 3. Cập nhật trạng thái isTrending vào database
            List<PropertyEntity> allProperties = propertyRepository.findAll();
            int trendingCount = 0;

            for (PropertyEntity property : allProperties) {
                boolean isTrendingNow = trendingSet.contains(property.getId());
                property.setIsTrending(isTrendingNow);
                if (isTrendingNow) {
                    trendingCount++;
                }
            }

            propertyRepository.saveAll(allProperties);
            log.info("[RoomTrendingScheduler] Đã cập nhật thành công: {} phòng Trending trên tổng số {} phòng.", 
                     trendingCount, allProperties.size());
        } catch (Exception e) {
            log.error("[RoomTrendingScheduler] Lỗi khi cập nhật trạng thái Trending: {}", e.getMessage(), e);
        }
    }
}

