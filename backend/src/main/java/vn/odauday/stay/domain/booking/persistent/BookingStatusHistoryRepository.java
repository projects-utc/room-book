package vn.odauday.stay.domain.booking.persistent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.odauday.stay.domain.booking.model.BookingStatusHistoryEntity;

@Repository
public interface BookingStatusHistoryRepository extends JpaRepository<BookingStatusHistoryEntity, Long> {
}
