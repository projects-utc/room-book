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
import vn.odauday.stay.application.service.property.PropertyService;
import vn.odauday.stay.domain.property.model.PropertyEntity;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/properties")
public class PropertyController {

    private final PropertyService propertyService;

    @GetMapping
    public ApiResponse<List<PropertyEntity>> getProperties() {
        return ApiResponse.ok(propertyService.getAllProperties());
    }

    @GetMapping("/{id}")
    public ApiResponse<PropertyEntity> getPropertyById(@PathVariable Long id) {
        return ApiResponse.ok(propertyService.getPropertyById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PropertyEntity> createProperty(@RequestBody PropertyEntity property) {
        return ApiResponse.ok("Đã tạo cơ sở lưu trú thành công", propertyService.createProperty(property));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteProperty(@PathVariable Long id) {
        propertyService.deleteProperty(id);
        return ApiResponse.ok("Đã xóa cơ sở lưu trú", null);
    }

    @PatchMapping("/{id}/toggle-status")
    public ApiResponse<PropertyEntity> togglePropertyStatus(@PathVariable Long id) {
        return ApiResponse.ok("Đã cập nhật trạng thái cơ sở lưu trú", propertyService.togglePropertyStatus(id));
    }
}
