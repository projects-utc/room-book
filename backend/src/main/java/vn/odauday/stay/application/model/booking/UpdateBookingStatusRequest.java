package vn.odauday.stay.application.model.booking;

import jakarta.validation.constraints.NotBlank;

public record UpdateBookingStatusRequest(@NotBlank String status, String reason) {
}
