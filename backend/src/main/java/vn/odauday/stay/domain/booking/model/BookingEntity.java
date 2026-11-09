package vn.odauday.stay.domain.booking.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "bookings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonIgnore
    private Long id;

    @Column(name = "booking_code", unique = true, nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String guestUsername;

    @Column(length = 150)
    private String guestName;

    @Column(length = 30)
    private String guestPhone;

    @Column(length = 150)
    private String guestEmail;

    @Column(nullable = false)
    private Long propertyId;

    @Column(length = 200)
    private String propertyName;

    @Column(nullable = false)
    private Long roomId;

    @Column(length = 200)
    private String roomName;

    @Column(name = "check_in_date", length = 30)
    private String checkIn;

    @Column(name = "check_out_date", length = 30)
    private String checkOut;

    private Integer nights;

    private Integer guests;

    private Double pricePerNight;

    private Double subtotal;

    private Double serviceFee;

    private Double total;

    @Column(name = "booking_status", length = 30)
    @JsonProperty("status")
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "payment_method", length = 50)
    @JsonProperty("payment_method")
    @JsonAlias({"payment_method", "paymentMethod"})
    private String paymentMethod;

    @Column(name = "created_at_str", length = 30)
    private String createdAt;

    @Column(name = "is_reviewed")
    @JsonProperty("is_reviewed")
    @JsonAlias({"is_reviewed", "isReviewed"})
    @Builder.Default
    private Boolean isReviewed = false;

    @JsonProperty("is_reviewed")
    public Boolean getIs_reviewed() {
        return isReviewed;
    }

    @JsonProperty("payment_method")
    public String getPayment_method() {
        return paymentMethod;
    }
}