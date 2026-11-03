package vn.odauday.stay.domain.promotion.model;

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
@Table(name = "promotions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "discount_type", length = 20, nullable = false)
    @JsonProperty("type")
    @Builder.Default
    private String type = "PERCENT";

    @Column(name = "discount_value", nullable = false)
    @JsonProperty("value")
    private Double value;

    private Double maxDiscount;

    @Builder.Default
    private Double minOrder = 0.0;

    @Builder.Default
    private Integer usageLimit = 100;

    @Builder.Default
    private Integer usedCount = 0;

    @Column(length = 30)
    private String validFrom;

    @Column(length = 30)
    private String validTo;

    @Column(name = "promo_status", length = 20)
    @JsonProperty("status")
    @Builder.Default
    private String status = "ACTIVE";

    @Column(length = 100)
    private String hostUsername;
}
