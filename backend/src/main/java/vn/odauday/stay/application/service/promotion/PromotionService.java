package vn.odauday.stay.application.service.promotion;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.odauday.stay.application.service.audit.AuditLogService;
import vn.odauday.stay.domain.promotion.model.PromotionEntity;
import vn.odauday.stay.domain.promotion.persistent.PromotionRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<PromotionEntity> getPromotions() {
        return promotionRepository.findAll();
    }

    @Transactional
    public PromotionEntity createPromotion(PromotionEntity promo) {
        String code = promo.getCode() != null ? promo.getCode().trim().toUpperCase() : "";
        if (code.isBlank()) {
            throw new IllegalArgumentException("Mã giảm giá không được để trống");
        }
        if (promotionRepository.existsByCode(code)) {
            throw new IllegalArgumentException("Mã giảm giá này đã tồn tại trên hệ thống");
        }
        promo.setCode(code);
        PromotionEntity saved = promotionRepository.save(promo);
        auditLogService.logAudit("CREATE_PROMO", code, "Tạo mới mã giảm giá: " + code, "admin");
        return saved;
    }

    @Transactional
    public PromotionEntity togglePromotion(Long id) {
        PromotionEntity p = promotionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mã giảm giá có ID: " + id));
        String nextStatus = "ACTIVE".equalsIgnoreCase(p.getStatus()) ? "INACTIVE" : "ACTIVE";
        p.setStatus(nextStatus);
        return promotionRepository.save(p);
    }

    @Transactional
    public void deletePromotion(Long id) {
        promotionRepository.findById(id).ifPresent(p -> {
            promotionRepository.delete(p);
            auditLogService.logAudit("DELETE_PROMO", p.getCode(), "Xóa mã giảm giá: " + p.getCode(), "admin");
        });
    }
}

