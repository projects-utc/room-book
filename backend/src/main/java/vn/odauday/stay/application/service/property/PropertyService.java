package vn.odauday.stay.application.service.property;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.odauday.stay.application.service.audit.AuditLogService;
import vn.odauday.stay.domain.booking.persistent.BookingRepository;
import vn.odauday.stay.domain.property.model.PropertyEntity;
import vn.odauday.stay.domain.property.persistent.PropertyRepository;
import vn.odauday.stay.domain.review.model.ReviewEntity;
import vn.odauday.stay.domain.review.persistent.ReviewRepository;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final AuditLogService auditLogService;

    private void enrichRating(PropertyEntity property) {
        if (property == null || property.getId() == null) return;
        List<ReviewEntity> propertyReviews = reviewRepository.findByPropertyId(property.getId());
        if (propertyReviews != null && !propertyReviews.isEmpty()) {
            List<ReviewEntity> validReviews = propertyReviews.stream()
                    .filter(r -> r.getRating() != null && r.getRating() > 0)
                    .toList();
            if (!validReviews.isEmpty()) {
                double avg = validReviews.stream()
                        .mapToInt(ReviewEntity::getRating)
                        .average()
                        .orElse(0.0);
                property.setRating(Math.round(avg * 10.0) / 10.0);
                property.setReviewsCount(validReviews.size());
            } else {
                property.setRating(null);
                property.setReviewsCount(0);
            }
        } else {
            property.setRating(null);
            property.setReviewsCount(0);
        }
    }

    /**
     * TÍNH TOÁN CỜ PHÒNG HOT (isTrending / isHot) THEO THỜI GIAN (TIME-BOUND):
     * Một phòng được đánh dấu Hot (isTrending = true) NẾU thỏa mãn MỘT TRONG CÁC điều kiện:
     * - Điều kiện A: Có số lượt đặt phòng >= 5 tính riêng trong vòng 30 ngày gần nhất (khoảng thời gian).
     * - Điều kiện B: Nằm trong Top 10% phòng có lượt xem (views_7d) cao nhất trong 7 ngày qua.
     * - Điều kiện C: Cờ isHot = true (được Admin set cứng trong Database).
     */
    public void enrichHotAndTrending(List<PropertyEntity> properties) {
        if (properties == null || properties.isEmpty()) return;

        // 1. Điều kiện B: Tính ngưỡng lượt xem Top 10% trong 7 ngày qua
        List<Long> viewsList = properties.stream()
                .map(PropertyEntity::getViews7d)
                .filter(v -> v != null && v > 0)
                .sorted(Comparator.reverseOrder())
                .collect(Collectors.toList());

        long minViewsTop10Percent = Long.MAX_VALUE;
        if (!viewsList.isEmpty()) {
            int topCount = Math.max(1, (int) Math.ceil(viewsList.size() * 0.10));
            minViewsTop10Percent = viewsList.get(topCount - 1);
        }

        // 2. Điều kiện A: Lấy danh sách propertyId có >= 5 bookings trong 30 ngày gần nhất
        String thirtyDaysAgo = LocalDate.now().minusDays(30).format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        Set<Long> hotBookingPropertyIds = new HashSet<>(
                bookingRepository.findHotPropertyIdsByRecentBookings(thirtyDaysAgo, 5L)
        );

        // 3. Đánh dấu isTrending cho từng phòng
        for (PropertyEntity property : properties) {
            boolean isCondA = hotBookingPropertyIds.contains(property.getId());
            boolean isCondB = property.getViews7d() != null 
                    && property.getViews7d() > 0 
                    && property.getViews7d() >= minViewsTop10Percent;
            boolean isCondC = Boolean.TRUE.equals(property.getIsHot());

            boolean isHotOrTrending = isCondA || isCondB || isCondC;
            property.setIsTrending(isHotOrTrending);
        }
    }

    @Transactional(readOnly = true)
    public List<PropertyEntity> getAllProperties() {
        List<PropertyEntity> list = propertyRepository.findAll();
        list.forEach(this::enrichRating);
        enrichHotAndTrending(list);
        return list;
    }

    @Transactional(readOnly = true)
    public List<PropertyEntity> getHotProperties() {
        List<PropertyEntity> all = getAllProperties();
        return all.stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsTrending()) || Boolean.TRUE.equals(p.getIsHot()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PropertyEntity getPropertyById(Long id) {
        PropertyEntity p = propertyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy cơ sở lưu trú có ID: " + id));
        enrichRating(p);
        enrichHotAndTrending(List.of(p));
        return p;
    }

    @Transactional
    public PropertyEntity createProperty(PropertyEntity property) {
        PropertyEntity saved = propertyRepository.save(property);
        auditLogService.logAudit("CREATE_PROPERTY", saved.getName(), "Tạo mới cơ sở lưu trú: " + saved.getName(), saved.getOwner());
        return saved;
    }

    @Transactional
    public void deleteProperty(Long id) {
        propertyRepository.findById(id).ifPresent(p -> {
            propertyRepository.delete(p);
            auditLogService.logAudit("DELETE_PROPERTY", p.getName(), "Xóa cơ sở lưu trú: " + p.getName(), "admin");
        });
    }

    @Transactional
    public PropertyEntity togglePropertyStatus(Long id) {
        PropertyEntity p = getPropertyById(id);
        String nextStatus = "ACTIVE".equalsIgnoreCase(p.getStatus()) ? "LOCKED" : "ACTIVE";
        p.setStatus(nextStatus);
        PropertyEntity saved = propertyRepository.save(p);
        auditLogService.logAudit("TOGGLE_PROPERTY", p.getName(), "LOCKED".equals(nextStatus) ? "Tạm khóa cơ sở lưu trú" : "Mở khóa cơ sở lưu trú", "admin");
        return saved;
    }
}

