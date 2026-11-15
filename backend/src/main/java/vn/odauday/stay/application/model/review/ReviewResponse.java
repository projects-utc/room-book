package vn.odauday.stay.application.model.review;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReviewResponse {
    private Long id;
    private String bookingCode;
    private Long propertyId;
    private String guestUsername;
    private String guestName;
    private Integer rating;
    private String comment;
    private String date;
}