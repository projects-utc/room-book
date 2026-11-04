package vn.odauday.stay.domain.audit.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "action_type", length = 50, nullable = false)
    @JsonProperty("action")
    private String action;

    @Column(nullable = false, length = 200)
    private String target;

    @Column(length = 2000)
    private String details;

    @Column(length = 100)
    private String performedBy;

    @Column(name = "log_timestamp", length = 50)
    @JsonProperty("timestamp")
    private String timestamp;
}
