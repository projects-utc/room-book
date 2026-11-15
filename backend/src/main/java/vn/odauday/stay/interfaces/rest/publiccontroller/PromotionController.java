package vn.odauday.stay.interfaces.rest.publiccontroller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.odauday.stay.application.common.ApiResponse;
import vn.odauday.stay.application.service.promotion.PromotionService;
import vn.odauday.stay.domain.promotion.model.PromotionEntity;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/promotions")
public class PromotionController {

    private final PromotionService promotionService;

    @GetMapping
    public ApiResponse<List<PromotionEntity>> getPromotions() {
        return ApiResponse.ok(promotionService.getPromotions());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PromotionEntity> createPromotion(@RequestBody PromotionEntity promo) {
        return ApiResponse.ok("Đã tạo mã giảm giá thành công", promotionService.createPromotion(promo));
    }

    @PatchMapping("/{id}/toggle")
    public ApiResponse<PromotionEntity> togglePromotion(@PathVariable Long id) {
        return ApiResponse.ok("Đã cập nhật trạng thái mã giảm giá", promotionService.togglePromotion(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deletePromotion(@PathVariable Long id) {
        promotionService.deletePromotion(id);
        return ApiResponse.ok("Đã xóa mã giảm giá", null);
    }
}
