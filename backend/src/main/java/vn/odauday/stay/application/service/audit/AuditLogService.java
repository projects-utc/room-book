package vn.odauday.stay.application.service.audit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.odauday.stay.domain.audit.model.AuditLogEntity;
import vn.odauday.stay.domain.audit.persistent.AuditLogRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public List<AuditLogEntity> getAllLogs() {
        return auditLogRepository.findAll();
    }

    @Transactional
    public AuditLogEntity createLog(AuditLogEntity logEntity) {
        if (logEntity.getTimestamp() == null || logEntity.getTimestamp().isBlank()) {
            logEntity.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        }
        return auditLogRepository.save(logEntity);
    }

    @Transactional
    public void logAudit(String action, String target, String details, String performedBy) {
        try {
            AuditLogEntity logEntity = AuditLogEntity.builder()
                    .action(action)
                    .target(target)
                    .details(details)
                    .performedBy(performedBy != null && !performedBy.isBlank() ? performedBy : "admin")
                    .timestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                    .build();
            auditLogRepository.save(logEntity);
        } catch (Exception e) {
            log.warn("Failed to write audit log: {}", e.getMessage());
        }
    }
}

