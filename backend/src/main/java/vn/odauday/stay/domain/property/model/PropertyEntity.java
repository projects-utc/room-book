package vn.odauday.stay.domain.property.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "properties")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String owner;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 50)
    private String type;

    @Column(length = 500)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String area;

    private Double rating;

    private Integer reviewsCount;

    private Double priceMin;

    @Column(name = "description", length = 2000)
    @JsonProperty("desc")
    private String desc;

    @Column(length = 500)
    private String image;

    @Column(length = 50)
    private String badge;

    @Column(name = "is_hot")
    @JsonProperty("isHot")
    @Builder.Default
    private Boolean isHot = false;

    @Column(name = "views_7d")
    @JsonProperty("views7d")
    @Builder.Default
    private Long views7d = 0L;

    @Column(name = "is_trending")
    @JsonProperty("isTrending")
    @Builder.Default
    private Boolean isTrending = false;

    @JsonIgnore
    @Column(name = "amenities_raw", length = 1000)
    private String amenitiesRaw;

    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @JsonProperty("amenities")
    public List<String> getAmenities() {
        if (amenitiesRaw == null || amenitiesRaw.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(amenitiesRaw.split("\\|"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    @JsonProperty("amenities")
    public void setAmenities(List<String> amenities) {
        if (amenities == null || amenities.isEmpty()) {
            this.amenitiesRaw = "";
        } else {
            this.amenitiesRaw = String.join("|", amenities);
        }
    }
}
