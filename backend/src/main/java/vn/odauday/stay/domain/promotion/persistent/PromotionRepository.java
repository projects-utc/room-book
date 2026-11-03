package vn.odauday.stay.domain.promotion.persistent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.odauday.stay.domain.promotion.model.PromotionEntity;

import java.util.Optional;

@Repository
public interface PromotionRepository extends JpaRepository<PromotionEntity, Long> {
    Optional<PromotionEntity> findByCode(String code);
    boolean existsByCode(String code);
}
