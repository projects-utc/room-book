---
module: booking
layer: api
task: https://github.com/projects-utc/room-book/issues/booking
owner: QA/SDET
status: chờ duyệt
status: đã impl
updated: 2026-11-08
---

# Test Plan — Phân Hệ Đặt Phòng (Booking Module)

## 0. Oracles [BẮT BUỘC]

| Oracle | Trạng thái | Nguồn |
|---|---|---|
| **O1 Design (Figma)** | [KHÔNG ÁP DỤNG] | Đợt test này tập trung kiểm thử tầng API backend |
| **O2 Parity** | ✅ có | Mô tả thực thể và ràng buộc trong `database_ver2.sql` |
| **O3 API contract + BA rule** | ✅ có | `BookingController.java`, `BookingService.java`, `database_ver2.sql` (probe ngày 2026-11-08) |
| **O4 Permission matrix** | ✅ có | Phân quyền vai trò GUEST, HOST, ADMIN theo `database_ver2.sql` |

## 1. Phạm vi [BẮT BUỘC]

**Trong phạm vi:**
- `POST /api/bookings`: Tạo đơn đặt phòng mới
- `GET /api/bookings`: Lấy danh sách đơn đặt phòng (hỗ trợ lọc theo `guestUsername`)
- `GET /api/bookings/{code}`: Lấy thông tin chi tiết đơn đặt phòng theo mã đặt phòng
- `PATCH /api/bookings/{code}/status`: Cập nhật trạng thái đơn đặt phòng
- `POST /api/bookings/{code}/cancel`: Khách tự hủy đơn đặt phòng
- `POST /api/bookings/{code}/admin-cancel`: Quản trị viên can thiệp hủy đơn và ghi nhật ký kiểm toán

**NGOÀI phạm vi:**
- Giao diện người dùng Web React (sẽ triển khai ở test plan UI riêng).
- Tích hợp cổng thanh toán trực tuyến bên thứ ba (VNPay, Momo).

## 2. Tiền đề [BẮT BUỘC]

| Thứ | Giá trị | Ghi chú |
|---|---|---|
| Môi trường | BE Spring Boot (`-DbeUrl`, mặc định `8080`) & FE Vite React (`-DfeUrl`, mặc định `5173`) | Thực thi độc lập từ thư mục `auto-test/` bằng Playwright for Java & JUnit 5 |
| Tài khoản và quyền | GUEST (`guest1`), HOST (`host1`), ADMIN (`admin`) | Dùng kiểm tra phân quyền và IDOR |
| Dữ liệu cần sẵn | 1 cơ sở lưu trú (`propertyId=1`), 1 phòng hợp lệ (`roomId=1`, giá 500.000 VNĐ, tối đa 2 khách) | Tái sử dụng dữ liệu mẫu sẵn có |
| Dọn dữ liệu | Tag `AUTO_QA` cho mã đơn tạo mới | Đảm bảo dọn dẹp sau khi chạy kiểm thử |

## 3. Data Map [BẮT BUỘC với API]

| Field | Type | Required | Min | Max | Note |
|---|---|---|---|---|---|
| `guestUsername` | String | Có | 1 | 100 | Tên tài khoản người đặt |
| `guestName` | String | Không | 1 | 150 | Họ tên khách lưu trú |
| `guestPhone` | String | Không | 8 | 30 | Số điện thoại liên hệ |
| `guestEmail` | String | Không | 5 | 150 | Email nhận thông báo |
| `propertyId` | Long | Có | 1 | - | Định danh cơ sở lưu trú |
| `roomId` | Long | Có | 1 | - | Định danh phòng đặt |
| `checkIn` | String | Có | 10 | 10 | Định dạng ngày `YYYY-MM-DD` |
| `checkOut` | String | Có | 10 | 10 | Định dạng ngày `YYYY-MM-DD`, phải sau `checkIn` |
| `nights` | Integer | Không | 1 | 365 | Số đêm lưu trú (`checkOut - checkIn`) |
| `guests` | Integer | Có | 1 | 20 | Số lượng khách, không vượt quá `max_guests` của phòng |
| `pricePerNight` | Double | Có | 0 | - | Đơn giá phòng theo đêm |
| `subtotal` | Double | Có | 0 | - | `pricePerNight * nights` |
| `serviceFee` | Double | Không | 0 | - | Phí dịch vụ hệ thống |
| `total` | Double | Có | 0 | - | Tổng thanh toán (`subtotal + serviceFee - discount`) |
| `status` | String | Không | - | 30 | Mặc định là `PENDING` khi tạo mới |

## 4. Business Rules [BẮT BUỘC]

| # | Rule | Nguồn | Đã verify? |
|---|---|---|---|
| BR-01 | Ngày trả phòng `checkOut` phải sau ngày nhận phòng `checkIn` (`nights >= 1`). | `database_ver2.sql` dòng 169 | Đã verify qua code |
| BR-02 | Không được đặt phòng trùng lịch nếu phòng đã có đơn ở trạng thái `PENDING`, `CONFIRMED`, `CHECKED_IN` giao khoảng ngày. | `database_ver2.sql` dòng 298 | Đã verify qua code |
| BR-03 | Khi tạo mới không truyền `code`, hệ thống tự sinh mã theo cấu trúc `ODD-YYYY-NNNN`. | `BookingService.java` dòng 40 | Đã verify qua code |
| BR-04 | Khách chỉ được tự hủy đơn khi trạng thái đơn đang là `PENDING`. | `database_ver2.sql` dòng 293 | Đã verify qua code |
| BR-05 | Admin can thiệp hủy đơn tại `admin-cancel` bắt buộc ghi lại nhật ký vào `account_audit_log` kèm lý do. | `BookingService.java` dòng 73 | Đã verify qua code |
| BR-06 | Khi cập nhật trạng thái đơn qua `status`, giá trị mới không được để trống và phải chuyển thành chữ hoa. | `BookingService.java` dòng 53 | Đã verify qua code |

## 5. Test Cases [BẮT BUỘC]

### Valid (V)

| ID | Loại | Mô tả | Input | Expected | Ưu tiên | Tag | Nguồn oracle |
|---|---|---|---|---|---|---|---|
| C-V01 | Valid | Tạo đơn đặt phòng hợp lệ với đầy đủ thông tin chuẩn | Body JSON hợp lệ, `guestUsername="guest1"`, `roomId=1`, `nights=2` | `toBe(201)` + `success=true` + `status="PENDING"` + mã sinh dạng `ODD-*` | P1 | `@smoke` | BR-03 |
| C-V02 | Valid | Tạo đơn đặt phòng với số đêm tối thiểu là 1 đêm (Boundary in-range) | `checkIn="2026-12-01"`, `checkOut="2026-12-02"`, `nights=1` | `toBe(201)` + `success=true` | P1 | `@smoke` | BR-01 |
| C-V03 | Valid | Tạo đơn đặt phòng với số khách đúng bằng sức chứa tối đa của phòng (Boundary in-range) | `roomId=1` có `max_guests=2`, gửi `guests=2` | `toBe(201)` + `success=true` | P2 | | BR-01 |
| C-V04 | Valid | Tạo đơn không truyền `code` và `createdAt` (Boundary in-range) | Bỏ trống field `code` và `createdAt` trong request body | `toBe(201)` + sinh mã `code` tự động và `createdAt` tự động | P2 | | BR-03 |
| L-V05 | Valid | Lấy danh sách đơn đặt phòng lọc theo `guestUsername` | `GET /api/bookings?guestUsername=guest1` | `toBe(200)` + danh sách trả về chỉ chứa đơn của `guest1` | P1 | `@smoke` | O3 |
| L-V06 | Valid | Lấy chi tiết đơn đặt phòng theo mã hợp lệ | `GET /api/bookings/{code}` với mã vừa tạo | `toBe(200)` + `data.code == code` + thông tin khớp dữ liệu tạo | P1 | `@smoke` | O3 |
| T-V07 | Valid | Khách tự hủy đơn đặt phòng đang ở trạng thái `PENDING` | `POST /api/bookings/{code}/cancel` | `toBe(200)` + `data.status == "CANCELLED"` | P1 | `@smoke` | BR-04 |
| T-V08 | Valid | Admin can thiệp hủy đơn kèm theo lý do cụ thể | `POST /api/bookings/{code}/admin-cancel` với `{"reason": "Khách đổi lịch khẩn cấp"}` | `toBe(200)` + `status == "CANCELLED"` + ghi nhận audit log | P1 | | BR-05 |
| U-V09 | Valid | Cập nhật trạng thái đơn đặt phòng sang `CONFIRMED` | `PATCH /api/bookings/{code}/status` với `{"status": "confirmed"}` | `toBe(200)` + `data.status == "CONFIRMED"` (tự chuyển in hoa) | P1 | | BR-06 |
| C-V10 | Valid | Cross-check kiểm tra tính toàn vẹn dữ liệu sau khi ghi đơn | Tạo đơn -> Đọc lại qua `GET /api/bookings/{code}` | `toBe(200)` + đối chiếu `subtotal`, `serviceFee`, `total` khớp nhau | P1 | | O3 |
| C-V11 | Valid | Tạo thành công 2 đơn đặt phòng cho 2 phòng khác nhau trong cùng khoảng thời gian | 2 request tạo đơn với `roomId=1` và `roomId=2` cùng ngày | Cả 2 request đều nhận `toBe(201)` | P2 | | BR-02 |

### Invalid (I)

| ID | Loại | Mô tả | Input | Expected | Ưu tiên | Tag | Nguồn oracle |
|---|---|---|---|---|---|---|---|
| C-I01 | Invalid | Ngày nhận phòng và ngày trả phòng trùng nhau (`nights=0`) (Boundary out-of-range) | `checkIn="2026-12-01"`, `checkOut="2026-12-01"` | `toBe(400)` + báo lỗi ngày không hợp lệ | P1 | `@smoke` | BR-01 |
| C-I02 | Invalid | Ngày trả phòng đứng trước ngày nhận phòng (Boundary out-of-range) | `checkIn="2026-12-05"`, `checkOut="2026-12-01"` | `toBe(400)` + báo lỗi khoảng ngày không hợp lệ | P1 | | BR-01 |
| C-I03 | Invalid | Số lượng khách nhận giá trị 0 hoặc số âm (Boundary out-of-range) | `guests = 0` hoặc `guests = -1` | `toBe(400)` + báo lỗi số khách không hợp lệ | P2 | | BR-01 |
| C-I04 | Invalid | Số lượng khách vượt quá sức chứa tối đa của phòng (Boundary out-of-range) | `roomId=1` (`max_guests=2`), gửi `guests=5` | `toBe(400)` + báo lỗi vượt sức chứa | P2 | | BR-01 |
| C-I05 | Invalid | Đơn giá phòng nhận giá trị số âm (Boundary out-of-range) | `pricePerNight = -200000.0` | `toBe(400)` + báo lỗi giá tiền âm | P2 | | O3 |
| C-I06 | Invalid | Thiếu trường bắt buộc `guestUsername` | Request body khuyết trường `guestUsername` | `toBe(400)` hoặc từ chối lưu dữ liệu | P1 | | O3 |
| C-I07 | Invalid | Thiếu trường bắt buộc `propertyId` | Request body khuyết trường `propertyId` | `toBe(400)` + báo lỗi thiếu cơ sở lưu trú | P1 | | O3 |
| C-I08 | Invalid | Thiếu trường bắt buộc `roomId` | Request body khuyết trường `roomId` | `toBe(400)` + báo lỗi thiếu phòng | P1 | | O3 |
| C-I09 | Invalid | Đặt phòng bị trùng lịch với đơn khác đã được xác nhận (Overlapping booking) | Cùng `roomId`, khoảng ngày giao với đơn đang `CONFIRMED` | `toBe(400)` + thông báo phòng đã có người đặt | P1 | `@smoke` | BR-02 |
| L-I10 | Invalid | Tra cứu chi tiết đơn bằng mã đặt phòng không tồn tại | `GET /api/bookings/ODD-UNKNOWN-9999` | `toBe(400)` + message "Không tìm thấy đơn đặt phòng có mã: ODD-UNKNOWN-9999" | P1 | | O3 |
| U-I11 | Invalid | Cập nhật trạng thái đơn với giá trị `status` rỗng hoặc null | `PATCH /api/bookings/{code}/status` với `{"status": ""}` | `toBe(400)` + message "Trạng thái mới không được để trống" | P2 | | BR-06 |
| U-I12 | Invalid | Cập nhật trạng thái cho đơn không tồn tại | `PATCH /api/bookings/ODD-FAKE-0000/status` với `{"status": "CONFIRMED"}` | `toBe(400)` + message không tìm thấy đơn | P2 | | O3 |
| T-I13 | Invalid | Khách gọi hủy đơn khi trạng thái đơn đã `COMPLETED` | Đơn đã hoàn tất, gọi `POST /api/bookings/{code}/cancel` | `toBe(400)` + chặn không cho phép hủy | P1 | | BR-04 |
| C-I14 | Invalid | Disruption: Đứt kết nối mạng trong quá trình gửi request tạo đơn | Ngắt kết nối client trước khi nhận phản hồi | Database không ghi nhận bản ghi rác mồ côi | P2 | | O3 |
| C-I15 | Invalid | Disruption: Double click nút đặt phòng (gửi 2 request giống hệt cùng lúc) | 2 request tạo đơn cùng payload gửi đồng thời | Chỉ 1 đơn được tạo thành công, request thứ hai bị từ chối | P1 | | BR-02 |
| C-I16 | Invalid | Disruption: Race condition giữa 2 khách hàng cùng đặt 1 phòng trong cùng khoảng ngày | 2 user khác nhau cùng POST đặt chung phòng và ngày | Tối đa 1 đơn thành công, đơn còn lại nhận `toBe(400)` | P1 | | BR-02 |

### Security (S)

| ID | Loại | Mô tả | Input | Expected | Ưu tiên | Tag | Nguồn oracle |
|---|---|---|---|---|---|---|---|
| L-S01 | Security | SQL Injection qua tham số lọc `guestUsername` | `GET /api/bookings?guestUsername=' OR '1'='1` | `toBe(200)` + danh sách rỗng, không rò rỉ dữ liệu của khách khác | P1 | | O4 |
| C-S02 | Security | XSS Stored qua trường tên khách hàng `guestName` | `guestName="<script>alert(1)</script>"` | `toBe(201)` + dữ liệu được lưu an toàn hoặc sanitize, không chạy mã script | P1 | | O3 |
| T-S03 | Security | IDOR: Khách A gọi API hủy đơn phòng của khách B | Dùng phiên của khách A gọi `POST /api/bookings/{code_khach_B}/cancel` | `toBe(403)` Forbidden hoặc `toBe(400)` từ chối quyền truy cập | P1 | | O4 |
| T-S04 | Security | Auth/Authz: Tài khoản khách gọi API can thiệp của Admin | Dùng token vai trò GUEST gọi `POST /api/bookings/{code}/admin-cancel` | `toBe(403)` Forbidden | P1 | | O4 |
| C-S05 | Security | Mass Assignment: Cố tình gán trường nhạy cảm khi tạo đơn | Request body chứa `isReviewed=true`, `status="COMPLETED"`, `id=9999` | Server bỏ qua hoặc ép lại mặc định `isReviewed=false`, `status="PENDING"` | P1 | | O3 |
| C-S06 | Security | Payload Abuse: Gửi chuỗi văn bản cực lớn (10.000 ký tự) | `guestName="A".repeat(10000)` | `toBe(400)` từ chối hợp lệ, không gây lỗi 500 hoặc sập ứng dụng | P2 | | O3 |
| L-S07 | Security | Path Traversal qua tham số đường dẫn `code` | `GET /api/bookings/..%2F..%2Fetc%2Fpasswd` | `toBe(400)` hoặc `toBe(404)`, không rò rỉ cấu trúc hệ điều hành | P1 | | O3 |
| C-S08 | Security | Payload Abuse: Gửi các ký tự Unicode lạ và null byte | `guestName="test\u0000guest\uD83D\uDE00"` | Hệ thống xử lý an toàn không bị lỗi phân tích chuỗi | P2 | | O3 |

## 6. Case chưa impl / Cần confirm

| ID | Vấn đề | Điều kiện để impl |
|---|---|---|
| C-I09 | Logic kiểm tra trùng phòng `check_in_date` và `check_out_date` hiện đang được xử lý ở tầng SQL/Cron, cần xác nhận kiểm tra realtime tại Controller | Xác nhận từ đội phát triển Backend |
| T-S03 | Phân quyền IDOR giữa các tài khoản khách cần tích hợp xác thực JWT/Session đang kích hoạt | Chốt phương thức truyền Auth Header |

