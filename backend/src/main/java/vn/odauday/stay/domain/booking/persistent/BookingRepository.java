package vn.odauday.stay.domain.booking.persistent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.odauday.stay.domain.booking.model.BookingEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<BookingEntity, Long> {
    Optional<BookingEntity> findByCode(String code);
    List<BookingEntity> findByGuestUsername(String guestUsername);
}
