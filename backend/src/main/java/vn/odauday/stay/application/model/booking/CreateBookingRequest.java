package vn.odauday.stay.application.model.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateBookingRequest(
        @NotNull Long propertyId,
        @NotNull Long roomId,
        @NotBlank String checkIn,
        @NotBlank String checkOut,
        @NotNull @Positive Integer guests,
        String guestName,
        String guestPhone,
        String guestEmail
) {
}
