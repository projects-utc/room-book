package vn.odauday.stay.application.model.booking;

import java.math.BigDecimal;

public record HostRevenueRow(
        Long hostId,
        Long roomId,
        String roomName,
        String revenueMonth,
        Long totalBookings,
        BigDecimal totalRevenue
) {
}
