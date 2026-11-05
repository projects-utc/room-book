package vn.odauday.stay.application.service.property;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.odauday.stay.application.service.audit.AuditLogService;
import vn.odauday.stay.domain.property.model.PropertyEntity;
import vn.odauday.stay.domain.property.persistent.PropertyRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<PropertyEntity> getAllProperties() {
        return propertyRepository.findAll();
    }

    @Transactional(readOnly = true)
    public PropertyEntity getPropertyById(Long id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy cơ sở lưu trú có ID: " + id));
    }

    @Transactional
    public PropertyEntity createProperty(PropertyEntity property) {
        PropertyEntity saved = propertyRepository.save(property);
        auditLogService.logAudit("CREATE_PROPERTY", saved.getName(), "Tạo mới cơ sở lưu trú: " + saved.getName(), saved.getOwner());
        return saved;
    }

    @Transactional
    public void deleteProperty(Long id) {
        propertyRepository.findById(id).ifPresent(p -> {
            propertyRepository.delete(p);
            auditLogService.logAudit("DELETE_PROPERTY", p.getName(), "Xóa cơ sở lưu trú: " + p.getName(), "admin");
        });
    }

    @Transactional
    public PropertyEntity togglePropertyStatus(Long id) {
        PropertyEntity p = getPropertyById(id);
        String nextStatus = "ACTIVE".equalsIgnoreCase(p.getStatus()) ? "LOCKED" : "ACTIVE";
        p.setStatus(nextStatus);
        PropertyEntity saved = propertyRepository.save(p);
        auditLogService.logAudit("TOGGLE_PROPERTY", p.getName(), "LOCKED".equals(nextStatus) ? "Tạm khóa cơ sở lưu trú" : "Mở khóa cơ sở lưu trú", "admin");
        return saved;
    }
}

