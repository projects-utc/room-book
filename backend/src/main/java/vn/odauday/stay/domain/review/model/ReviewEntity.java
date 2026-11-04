package vn.odauday.stay.domain.review.model;

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
@Table(name = "reviews")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String bookingCode;

    @Column(nullable = false)
    private Long propertyId;

    @Column(nullable = false, length = 100)
    private String guestUsername;

    @Column(length = 150)
    private String guestName;

    @Column(nullable = false)
    private Integer rating;

    @Column(name = "review_comment", length = 2000)
    @JsonProperty("comment")
    private String comment;

    @Column(name = "review_date", length = 30)
    @JsonProperty("date")
    private String date;
}
