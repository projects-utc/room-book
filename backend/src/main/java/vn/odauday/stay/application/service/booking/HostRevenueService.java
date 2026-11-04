package vn.odauday.stay.application.service.booking;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.odauday.stay.application.model.booking.HostRevenueRow;
import vn.odauday.stay.domain.user.model.User;
import vn.odauday.stay.domain.user.persistent.UserRepository;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HostRevenueService {

    private final UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(readOnly = true)
    public List<HostRevenueRow> getForHost(String username) {
        User host = userRepository.findByUsername(username)
                .orElseThrow(() -> new AccessDeniedException("Tài khoản không còn hợp lệ"));
        if (!"HOST".equalsIgnoreCase(host.getRole())) {
            throw new AccessDeniedException("Báo cáo doanh thu chỉ dành cho Chủ nhà");
        }
        return queryRows("select host_id, room_id, room_name, revenue_month, total_bookings, total_revenue " +
                        "from v_host_revenue where host_id = :hostId order by revenue_month desc, room_id",
                host.getId());
    }

    @Transactional(readOnly = true)
    public List<HostRevenueRow> getAllForAdmin() {
        return queryRows("select host_id, room_id, room_name, revenue_month, total_bookings, total_revenue " +
                "from v_host_revenue order by revenue_month desc, host_id, room_id", null);
    }

    @SuppressWarnings("unchecked")
    private List<HostRevenueRow> queryRows(String sql, Long hostId) {
        var query = entityManager.createNativeQuery(sql);
        if (hostId != null) query.setParameter("hostId", hostId);
        List<Object[]> rows = query.getResultList();
        return rows.stream().map(row -> new HostRevenueRow(
                asLong(row[0]),
                asLong(row[1]),
                row[2] == null ? "" : row[2].toString(),
                row[3] == null ? "" : row[3].toString(),
                asLong(row[4]),
                row[5] == null ? BigDecimal.ZERO : new BigDecimal(row[5].toString())
        )).toList();
    }

    private Long asLong(Object value) {
        return value == null ? null : new BigDecimal(value.toString()).longValue();
    }
}
