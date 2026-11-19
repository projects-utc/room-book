package vn.odauday.stay.application.model.booking;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Dữ liệu client được phép gửi khi đặt phòng.
 * Các trường do server quyết định (người đặt, mã đơn, trạng thái, đơn giá, tổng tiền, isReviewed...)
 * cố ý KHÔNG có ở đây; nếu client gửi kèm thì Jackson bỏ qua.
 */
@Data
public class CreateBookingRequest {

    @NotNull(message = "Cơ sở lưu trú (propertyId) không được để trống")
    private Long propertyId;

    @NotNull(message = "Phòng đặt (roomId) không được để trống")
    private Long roomId;

    @NotBlank(message = "Ngày nhận phòng không được để trống")
    private String checkIn;

    @NotBlank(message = "Ngày trả phòng không được để trống")
    private String checkOut;

    @NotNull(message = "Số lượng khách không được để trống")
    @Min(value = 1, message = "Số lượng khách phải lớn hơn 0")
    private Integer guests;

    @Size(max = 150, message = "Họ tên khách tối đa 150 ký tự")
    private String guestName;

    @Size(max = 30, message = "Số điện thoại tối đa 30 ký tự")
    private String guestPhone;

    @Size(max = 150, message = "Email tối đa 150 ký tự")
    private String guestEmail;

    @Size(max = 50, message = "Phương thức thanh toán tối đa 50 ký tự")
    @JsonAlias({"payment_method", "paymentMethod"})
    private String paymentMethod;

    @Size(max = 50, message = "Mã giảm giá tối đa 50 ký tự")
    private String promoCode;
}
