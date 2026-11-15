package vn.odauday.stay.application.service.promotion;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.odauday.stay.application.service.audit.AuditLogService;
import vn.odauday.stay.domain.promotion.model.PromotionEntity;
import vn.odauday.stay.domain.promotion.persistent.PromotionRepository;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
        if (promo.getValue() == null || promo.getValue() <= 0) {
            throw new IllegalArgumentException("Giá trị giảm giá phải lớn hơn 0");
        }
        if (promo.getUsageLimit() != null && promo.getUsageLimit() <= 0) {
            throw new IllegalArgumentException("Giới hạn lượt sử dụng phải lớn hơn 0");
        }
        promo.setCode(code);
        PromotionEntity saved = promotionRepository.save(promo);
        auditLogService.logAudit("CREATE_PROMO", code, "Tạo mới mã giảm giá: " + code, "admin");
        return saved;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> validateAndCalculateDiscount(String rawCode, Double orderAmount) {
        String code = rawCode != null ? rawCode.trim().toUpperCase() : "";
        if (code.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập mã giảm giá");
        }
        double orderTotal = orderAmount != null ? orderAmount : 0.0;
        if (orderTotal <= 0) {
            throw new IllegalArgumentException("Giá trị đơn đặt phòng phải lớn hơn 0");
        }

        PromotionEntity promo = promotionRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Mã giảm giá không tồn tại trên hệ thống"));

        if (!"ACTIVE".equalsIgnoreCase(promo.getStatus())) {
            throw new IllegalStateException("Mã giảm giá hiện đang tạm ngưng hoạt động");
        }

        if (promo.getValidTo() != null && !promo.getValidTo().isBlank()) {
            LocalDate expiryDate = LocalDate.parse(promo.getValidTo().trim().substring(0, Math.min(10, promo.getValidTo().trim().length())));
            if (expiryDate.isBefore(LocalDate.now())) {
                throw new IllegalStateException("Mã giảm giá đã hết hạn sử dụng");
            }
        }

        if (promo.getUsageLimit() != null && promo.getUsedCount() != null && promo.getUsedCount() >= promo.getUsageLimit()) {
            throw new IllegalStateException("Mã giảm giá đã hết lượt sử dụng");
        }

        if (promo.getMinOrder() != null && orderTotal < promo.getMinOrder()) {
            throw new IllegalArgumentException("Đơn đặt phòng chưa đạt giá trị tối thiểu để áp dụng mã giảm giá");
        }

        double discountAmount;
        if ("PERCENT".equalsIgnoreCase(promo.getType())) {
            discountAmount = orderTotal * ((promo.getValue() != null ? promo.getValue() : 0.0) / 100.0);
            if (promo.getMaxDiscount() != null && promo.getMaxDiscount() > 0) {
                discountAmount = Math.min(discountAmount, promo.getMaxDiscount());
            }
        } else {
            discountAmount = promo.getValue() != null ? promo.getValue() : 0.0;
        }
        discountAmount = Math.min(discountAmount, orderTotal);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("code", promo.getCode());
        result.put("discountAmount", discountAmount);
        result.put("finalAmount", Math.max(0.0, orderTotal - discountAmount));
        result.put("promotion", promo);
        return result;
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

