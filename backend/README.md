# ODauDay Stay - Backend Architecture & Base Documentation

Tài liệu hướng dẫn cấu trúc base backend cho dự án **ODauDay Stay** (Hệ thống đặt phòng nghỉ dưỡng / Room Booking).
Dự án được xây dựng dựa trên nền tảng **Java 17**, **Spring Boot 3.3.4** và **Gradle (Kotlin DSL)** theo định hướng kiến trúc **Clean Architecture / Layered Domain-Driven Design (DDD) tinh gọn**, tối ưu cho ứng dụng đặt phòng nghỉ dưỡng.

---

## 1. Công nghệ sử dụng (Tech Stack)

- **Ngôn ngữ**: Java 17 (LTS)
- **Framework**: Spring Boot 3.3.4
- **Build Tool**: Gradle 8.x / 9.x (Kotlin DSL `build.gradle.kts`)
- **Các thư viện chính**:
  - `spring-boot-starter-web`: Xây dựng RESTful APIs
  - `lombok`: Giảm thiểu boilerplate code (Getter, Setter, Builder,...)
  - `spring-boot-starter-test`: Unit test & Integration test (JUnit 5)
  - `spring-boot-starter-data-jpa` *(sẵn sàng kết nối)*: Tương tác cơ sở dữ liệu
- **CI/CD**: GitLab CI (`.gitlab-ci.yml`)

---

## 2. Cây thư mục dự án (Directory Structure)

```text
d:/room-book/backend/
├── build.gradle.kts                      # Cấu hình Gradle build (Kotlin DSL)
├── settings.gradle.kts                   # Khai báo tên project: odauday-stay-backend
├── .gitlab-ci.yml                        # Cấu hình CI/CD Pipeline
├── README.md                             # Tài liệu kiến trúc và hướng dẫn dự án
├── src/
│   ├── main/
│   │   ├── java/vn/odauday/stay/
│   │   │   ├── ODauDayStayApplication.java   # Entry point khởi chạy ứng dụng Spring Boot
│   │   │   │
│   │   │   ├── interfaces/                   # Tầng giao tiếp bên ngoài (Presentation Layer)
│   │   │   │   └── rest/
│   │   │   │       ├── privatecontroller/    # API yêu cầu xác thực (Host, Admin, Người dùng đã đăng nhập)
│   │   │   │       └── publiccontroller/     # API công khai (Khách vãng lai, tìm kiếm chỗ nghỉ, xem phòng)
│   │   │   │
│   │   │   ├── application/                  # Tầng ứng dụng & điều phối nghiệp vụ (Application Layer)
│   │   │   │   ├── common/                   # Các tiện ích và định nghĩa dùng chung
│   │   │   │   │   ├── constant/             # Hằng số hệ thống
│   │   │   │   │   ├── converter/            # Mapper chuyển đổi DTO <-> Entity
│   │   │   │   │   ├── enums/                # Định nghĩa enum (BookingStatus, Role, RoomType,...)
│   │   │   │   │   ├── util/                 # Các hàm tiện ích (DateUtil, SecurityUtil,...)
│   │   │   │   │   └── validator/            # Custom annotations & validation logic
│   │   │   │   ├── config/                   # Cấu hình Spring (Security, CORS, WebMvc, OpenAPI/Swagger,...)
│   │   │   │   ├── model/                    # Request & Response DTOs theo từng nghiệp vụ
│   │   │   │   │   ├── booking/              # DTO liên quan đến Đặt phòng
│   │   │   │   │   ├── property/             # DTO liên quan đến Chỗ nghỉ (Homestay, Căn hộ,...)
│   │   │   │   │   ├── room/                 # DTO liên quan đến Phòng
│   │   │   │   │   ├── user/                 # DTO liên quan đến Người dùng, Chủ nhà, Khách
│   │   │   │   │   ├── payment/              # DTO liên quan đến Thanh toán
│   │   │   │   │   └── review/               # DTO liên quan đến Đánh giá & Phản hồi
│   │   │   │   └── service/                  # Business Logic Service interfaces & implementations
│   │   │   │       ├── booking/
│   │   │   │       ├── property/
│   │   │   │       ├── room/
│   │   │   │       ├── user/
│   │   │   │       ├── payment/
│   │   │   │       └── review/
│   │   │   │
│   │   │   ├── domain/                       # Tầng lõi nghiệp vụ (Domain Layer)
│   │   │   │   ├── booking/
│   │   │   │   │   ├── model/                # JPA Entity (Booking)
│   │   │   │   │   └── persistent/           # Spring Data JPA Repository interface
│   │   │   │   ├── property/
│   │   │   │   │   ├── model/                # JPA Entity (Property)
│   │   │   │   │   └── persistent/
│   │   │   │   ├── room/
│   │   │   │   │   ├── model/                # JPA Entity (Room)
│   │   │   │   │   └── persistent/
│   │   │   │   ├── user/
│   │   │   │   │   ├── model/                # JPA Entity (User)
│   │   │   │   │   └── persistent/
│   │   │   │   ├── payment/
│   │   │   │   │   ├── model/                # JPA Entity (Payment)
│   │   │   │   │   └── persistent/
│   │   │   │   └── review/
│   │   │   │       ├── model/                # JPA Entity (Review)
│   │   │   │       └── persistent/
│   │   │   │
│   │   │   └── infrastructure/               # Tầng hạ tầng (Infrastructure Layer)
│   │   │       └── config/
│   │   │           └── properties/           # Các class @ConfigurationProperties (JWT, File Upload, v.v.)
│   │   │
│   │   └── resources/
│   │       └── application.yml               # Cấu hình môi trường (Port, DataSource, Logging,...)
│   │
│   └── test/java/vn/odauday/stay/            # Thư mục kiểm thử (Unit / Integration Tests)
```

---

## 3. Chi tiết vai trò từng tầng (Layer Responsibilities)

### 3.1. interfaces/ (Tầng giao diện / Controller)
- Chịu trách nhiệm tiếp nhận HTTP Request từ Frontend, kiểm tra tính hợp lệ sơ bộ (@Valid), gọi Application Service tương ứng và trả về HTTP Response (HTTP Status, JSON DTO).
- **Phân tách endpoint rõ ràng**:
  - publiccontroller/: Chứa các API công khai không yêu cầu token đăng nhập (VD: xem danh sách phòng, tìm kiếm lọc phòng, đăng ký, đăng nhập).
  - privatecontroller/: Chứa các API yêu cầu xác thực hoặc phân quyền (VD: đặt phòng, hủy phòng, quản lý chỗ nghỉ của host, quản trị viên duyệt phòng).

### 3.2. pplication/ (Tầng ứng dụng & điều phối)
- **model/**: Chứa các đối tượng truyền tải dữ liệu (DTO - Data Transfer Object) cho từng miền nghiệp vụ:
  - *Request DTOs*: dữ liệu đầu vào (VD: CreateBookingRequest, PropertyFilterRequest).
  - *Response DTOs*: dữ liệu trả về cho client (VD: BookingDetailResponse, RoomSummaryResponse).
- **service/**: Chứa logic xử lý nghiệp vụ, điều phối giữa các repository và thực hiện tính toán (VD: tính tổng tiền phòng, kiểm tra phòng trống theo ngày, đổi trạng thái đặt phòng).
- **common/**: Thư viện dùng chung cho toàn bộ ứng dụng:
  - constant: Chuỗi hằng số, thông điệp hệ thống.
  - converter: Lớp hỗ trợ chuyển đổi giữa Entity và DTO (MapStruct hoặc Converter thủ công).
  - enums: Các trạng thái và phân loại chuẩn (BookingStatus, PaymentMethod, Role,...).
  - util: Các helper tĩnh về xử lý ngày tháng, chuỗi, bảo mật.
  - alidator: Các annotation và logic xác thực dữ liệu tùy biến.
- **config/**: Cấu hình các Bean của ứng dụng: WebMvcConfig, CorsFilter, SpringSecurity, Swagger/OpenAPI,...

### 3.3. domain/ (Tầng nghiệp vụ cốt lõi)
- Được tổ chức theo các miền nghiệp vụ (Business Domains) của hệ thống đặt phòng:
  - **ooking**: Đặt phòng, giữ chỗ, trạng thái lịch sử đặt phòng.
  - **property**: Cơ sở lưu trú, homestay, căn hộ, khách sạn, tiện ích đi kèm.
  - **oom**: Thông tin phòng, giá theo đêm, sức chứa, loại giường.
  - **user**: Tài khoản, thông tin cá nhân, phân quyền (Khách thuê, Chủ nhà, Quản trị viên).
  - **payment**: Thông tin hóa đơn, thanh toán, phương thức giao dịch.
  - **eview**: Đánh giá sao, bình luận trải nghiệm của khách hàng.
- Mỗi domain gồm 2 thành phần chính:
  - **model/**: Định nghĩa JPA Entity phản ánh bảng trong cơ sở dữ liệu.
  - **persistent/**: Chứa các interface Repository kế thừa JpaRepository của Spring Data JPA.

### 3.4. infrastructure/ (Tầng hạ tầng kỹ thuật)
- Chứa các cấu hình kỹ thuật, kết nối cơ sở dữ liệu, dịch vụ lưu trữ file ngoài.
- config/properties/: Các class @ConfigurationProperties binding cấu hình từ pplication.yml theo kiểu type-safe (VD: JwtProperties, StorageProperties).

---

## 4. Luồng dữ liệu chuẩn (Request Flow)

Một luồng xử lý API chuẩn tuân theo nguyên tắc Dependency Inversion:

`	ext
[Client / Frontend]
        │
        ▼ (HTTP Request JSON)
[interfaces/rest/ (Public/Private Controller)]
        │
        ▼ (Request DTO)
[application/service/] ─── (Dùng Converter) ─── [application/common/]
        │
        ▼ (Gọi JPA Repository / Entity)
[domain/{domain}/model & persistent]
        │
        ▼ (SQL Query)
[Database (MySQL / PostgreSQL / H2)]
`

---

## 5. Quy ước đặt tên & lập trình (Conventions)

| Thành phần | Quy ước đặt tên | Ví dụ |
| :--- | :--- | :--- |
| **Controller** | `<Domain><Scope>Controller` | `BookingPrivateController`, `PropertyPublicController` |
| **Service Interface** | `<Domain>Service` | `BookingService`, `RoomService` |
| **Service Impl** | `<Domain>ServiceImpl` | `BookingServiceImpl`, `RoomServiceImpl` |
| **Entity** | Danh từ số ít, PascalCase | `Booking`, `Room`, `Property`, `User` |
| **Repository** | `<Entity>Repository` | `BookingRepository`, `RoomRepository` |
| **Request DTO** | `<Action><Domain>Request` | `CreateBookingRequest`, `SearchPropertyRequest` |
| **Response DTO** | `<Domain><Type>Response` | `BookingResponse`, `PropertyDetailResponse` |
| **Enum** | Danh từ, PascalCase | `BookingStatus`, `PaymentMethod` |

---

## 6. Hướng dẫn chạy & kiểm thử dự án (Commands)

### Yêu cầu môi trường
- **JDK**: Java 17 trở lên (`java -version`)
- Sử dụng script Gradle Wrapper (`gradlew` / `gradlew.bat`) có sẵn trong repo.

### Các lệnh cơ bản

- **Biên dịch mã nguồn (Compile Classes)**:
```bash
./gradlew classes
```
*(Trên Windows: `gradlew.bat classes`)*

- **Chạy ứng dụng (Run Local Server)**:
```bash
./gradlew bootRun
```
*(Server mặc định chạy tại: `http://localhost:8080`)*

- **Chạy Unit & Integration Tests**:
```bash
./gradlew test
```

- **Đóng gói ứng dụng thành file JAR (Build Package)**:
```bash
./gradlew build -x test
```
*(File JAR xuất ra tại thư mục: `build/libs/`)*

---

## 7. Quy trình thêm một tính năng mới (Feature Workflow)

Khi phát triển một nghiệp vụ mới (ví dụ: `voucher` hoặc `notification`):
1. **Domain**: Khai báo Entity trong `domain/<name>/model/` và Repository interface trong `domain/<name>/persistent/`.
2. **DTO**: Khai báo Request/Response trong `application/model/<name>/`.
3. **Service**: Định nghĩa interface và triển khai logic trong `application/service/<name>/`.
4. **Controller**: Viết endpoint trong `interfaces/rest/publiccontroller/` hoặc `interfaces/rest/privatecontroller/` tùy theo yêu cầu bảo mật.
