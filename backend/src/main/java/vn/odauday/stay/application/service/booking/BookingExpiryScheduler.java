package vn.odauday.stay.application.service.booking;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingExpiryScheduler {

    private final BookingService bookingService;

    @Scheduled(fixedDelayString = "${app.booking.expiry-check-ms:60000}")
    public void cancelExpiredBookings() {
        int cancelled = bookingService.cancelExpiredPendingBookings();
        if (cancelled > 0) log.info("Automatically cancelled {} expired pending bookings", cancelled);
    }
}
