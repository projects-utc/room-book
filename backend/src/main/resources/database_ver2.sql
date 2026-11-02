-- ============================================================================
-- ODAUDAY STAY - DATABASE SCHEMA
-- Hệ thống quản lý cho thuê phòng (Homestay/Room Booking)
-- Thiết kế dựa trên sơ đồ Use Case & sơ đồ hoạt động (UC-01 -> UC-11)
-- Dialect: MySQL 8.0 (có thể chuyển sang PostgreSQL với thay đổi nhỏ)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. USERS - Người dùng (Khách thuê / Chủ nhà / Quản trị viên)
--    Tương ứng: UC-01 (Xác thực), UC-10 (Quản lý tài khoản), UC-11 (Cài đặt cá nhân)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    user_id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name           VARCHAR(100)  NOT NULL,
    email               VARCHAR(150)  NOT NULL UNIQUE,
    phone               VARCHAR(20)   UNIQUE,
    password_hash       VARCHAR(255)  NOT NULL,
    avatar_url          VARCHAR(255),
    role                ENUM('GUEST','HOST','ADMIN') NOT NULL DEFAULT 'GUEST',
    account_status      ENUM('ACTIVE','LOCKED') NOT NULL DEFAULT 'ACTIVE',  -- UC-10: Khóa/Mở khóa
    email_verified_at   DATETIME NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Quên mật khẩu / đặt lại mật khẩu (UC-01: Gửi mã xác thực qua Email)
CREATE TABLE password_reset_tokens (
    token_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    token        VARCHAR(255) NOT NULL,
    expires_at   DATETIME NOT NULL,
    used_at      DATETIME NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Lịch sử thay đổi vai trò / khóa tài khoản do Admin thực hiện (UC-10)
CREATE TABLE account_audit_log (
    log_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    target_user_id BIGINT NOT NULL,
    action       ENUM('LOCK','UNLOCK','CHANGE_ROLE') NOT NULL,
    old_value    VARCHAR(50),
    new_value    VARCHAR(50),
    performed_by BIGINT NOT NULL, -- admin thực hiện
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (target_user_id) REFERENCES users(user_id),
    FOREIGN KEY (performed_by)   REFERENCES users(user_id)
);

-- ----------------------------------------------------------------------------
-- 2. PROPERTIES & ROOMS - Chỗ ở & Phòng cho thuê
--    Tương ứng: UC-02 (Tìm kiếm & Xem chỗ ở)
-- ----------------------------------------------------------------------------
CREATE TABLE properties (
    property_id  BIGINT AUTO_INCREMENT PRIMARY KEY,
    host_id      BIGINT NOT NULL,               -- Chủ nhà sở hữu
    name         VARCHAR(150) NOT NULL,
    description  TEXT,
    address      VARCHAR(255) NOT NULL,
    city         VARCHAR(100),
    district     VARCHAR(100),
    latitude     DECIMAL(10,7),
    longitude    DECIMAL(10,7),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (host_id) REFERENCES users(user_id)
);

CREATE TABLE rooms (
    room_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    property_id      BIGINT NOT NULL,
    room_name        VARCHAR(150) NOT NULL,
    room_type        VARCHAR(50),                -- VD: Standard, Deluxe, Family
    price_per_night  DECIMAL(12,2) NOT NULL,
    max_guests       INT NOT NULL DEFAULT 2,
    room_status      ENUM('AVAILABLE','MAINTENANCE','INACTIVE') NOT NULL DEFAULT 'AVAILABLE', -- "Kiểm tra phòng (Trống/Bảo trì)"
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE
);

CREATE TABLE room_images (
    image_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id      BIGINT NOT NULL,
    image_url    VARCHAR(255) NOT NULL,
    is_primary   BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE
);

CREATE TABLE amenities (
    amenity_id    INT AUTO_INCREMENT PRIMARY KEY,
    amenity_name  VARCHAR(100) NOT NULL UNIQUE   -- VD: Wifi, Điều hòa, Bãi đỗ xe...
);

CREATE TABLE room_amenities (
    room_id      BIGINT NOT NULL,
    amenity_id   INT NOT NULL,
    PRIMARY KEY (room_id, amenity_id),
    FOREIGN KEY (room_id)     REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (amenity_id)  REFERENCES amenities(amenity_id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 3. PROMOTIONS - Mã giảm giá (UC-07: Quản lý mã giảm giá)
-- ----------------------------------------------------------------------------
CREATE TABLE promotions (
    promotion_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    host_id             BIGINT NULL,             -- NULL = mã toàn hệ thống; có giá trị = mã riêng của 1 chủ nhà
    code                VARCHAR(50) NOT NULL UNIQUE,
    discount_type       ENUM('PERCENT','FIXED') NOT NULL,
    discount_value      DECIMAL(12,2) NOT NULL,
    max_discount_amount DECIMAL(12,2) NULL,      -- áp trần khi discount_type = PERCENT
    min_order_amount    DECIMAL(12,2) DEFAULT 0,
    usage_limit         INT NULL,                -- NULL = không giới hạn
    used_count          INT NOT NULL DEFAULT 0,
    valid_from          DATETIME NOT NULL,
    valid_to            DATETIME NOT NULL,
    promotion_status    ENUM('ACTIVE','INACTIVE','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (host_id) REFERENCES users(user_id)
);

-- ----------------------------------------------------------------------------
-- 4. BOOKING_STATUSES - Danh mục trạng thái đơn (bảng tra cứu dùng chung)
--    [Góp ý] Dùng 1 bảng danh mục thay vì để bookings.booking_status là ENUM
--    và booking_status_history.old_status/new_status là VARCHAR tự do — tránh
--    2 nơi lưu tập giá trị trạng thái khác nhau, dễ lệch dữ liệu (VD: gõ nhầm
--    "CONFIRM" thay vì "CONFIRMED"). Cả 2 bảng bên dưới cùng FK về đây.
-- ----------------------------------------------------------------------------
CREATE TABLE booking_statuses (
    status_code   VARCHAR(20) PRIMARY KEY,   -- PENDING, CONFIRMED, CANCELLED, CHECKED_IN, COMPLETED
    description   VARCHAR(150)
);

INSERT INTO booking_statuses (status_code, description) VALUES
    ('PENDING',    'Đơn vừa tạo, chờ chủ nhà duyệt'),
    ('CONFIRMED',  'Chủ nhà đã duyệt, chờ khách đến nhận phòng'),
    ('CHECKED_IN', 'Khách đã nhận phòng'),
    ('COMPLETED',  'Khách đã trả phòng, kỳ lưu trú hoàn tất'),
    ('CANCELLED',  'Đơn bị hủy (khách/chủ nhà/hệ thống)');

-- ----------------------------------------------------------------------------
-- 5. BOOKINGS - Đơn đặt phòng (UC-03, UC-04, UC-08)
--    booking_status phản ánh đúng vòng đời trong sơ đồ hoạt động:
--    PENDING -> CONFIRMED -> CHECKED_IN -> COMPLETED
--    PENDING -> CANCELLED (khách hủy / chủ từ chối / hệ thống tự hủy do hết hạn)
-- ----------------------------------------------------------------------------
CREATE TABLE bookings (
    booking_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_code        VARCHAR(30) NOT NULL UNIQUE,
    guest_id            BIGINT NOT NULL,
    room_id             BIGINT NOT NULL,
    promotion_id        BIGINT NULL,             -- UC-07: mã giảm giá tùy chọn (extend của UC-06)
    check_in_date       DATE NOT NULL,
    check_out_date      DATE NOT NULL,
    num_guests          INT NOT NULL DEFAULT 1,
    subtotal_amount     DECIMAL(12,2) NOT NULL,  -- đơn giá x số đêm
    discount_amount     DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount        DECIMAL(12,2) NOT NULL,  -- subtotal - discount
    booking_status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- FK -> booking_statuses
    cancelled_by        ENUM('GUEST','HOST','SYSTEM') NULL,  -- SYSTEM = tự động hủy do hết hạn duyệt
    cancel_reason       VARCHAR(255) NULL,
    approval_deadline   DATETIME NOT NULL,       -- hạn chủ nhà phải duyệt trước khi hệ thống tự hủy
    confirmed_at        DATETIME NULL,
    checked_in_at       DATETIME NULL,
    checked_out_at      DATETIME NULL,           -- = thời điểm COMPLETED, dùng tính doanh thu (BR-08)
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (check_out_date > check_in_date),
    FOREIGN KEY (guest_id)       REFERENCES users(user_id),
    FOREIGN KEY (room_id)        REFERENCES rooms(room_id),
    FOREIGN KEY (promotion_id)   REFERENCES promotions(promotion_id),
    FOREIGN KEY (booking_status) REFERENCES booking_statuses(status_code)
);

-- Nhật ký thay đổi trạng thái đơn (phục vụ audit + đúng theo sơ đồ hoạt động chi tiết)
-- [Góp ý] old_status / new_status nay dùng chung danh mục booking_statuses
-- thay vì VARCHAR(20) tự do, đảm bảo đồng bộ với bookings.booking_status.
CREATE TABLE booking_status_history (
    history_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id   BIGINT NOT NULL,
    old_status   VARCHAR(20) NULL,       -- NULL cho lần ghi đầu tiên (đơn mới tạo)
    new_status   VARCHAR(20) NOT NULL,
    changed_by   BIGINT NULL,      -- NULL nếu do hệ thống tự động (VD: auto cancel hết hạn)
    note         VARCHAR(255),     -- VD: "TC-08 chặn hủy", "TC-09 403 sai chủ sở hữu"
    changed_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(user_id),
    FOREIGN KEY (old_status) REFERENCES booking_statuses(status_code),
    FOREIGN KEY (new_status) REFERENCES booking_statuses(status_code)
);

-- [Góp ý] Nhật ký mỗi lần một mã giảm giá được dùng cho một booking cụ thể.
-- Đây là nguồn sự thật (source of truth) để đối soát/tái tính used_count, thay vì
-- chỉ dựa vào việc UPDATE trực tiếp cột used_count (dễ lệch khi nhiều request
-- chạy đồng thời). UNIQUE(promotion_id, booking_id) đảm bảo 1 booking không thể
-- bị tính dùng trùng 1 mã 2 lần dù request có bị gọi lại (retry).
--
-- Cách xử lý concurrency ở tầng ứng dụng (trong 1 transaction):
--   1) INSERT INTO promotion_usages(promotion_id, booking_id) ...
--      -> nếu UNIQUE vi phạm: mã đã được dùng cho booking này, dừng lại.
--   2) UPDATE promotions
--         SET used_count = used_count + 1
--       WHERE promotion_id = ? AND (usage_limit IS NULL OR used_count < usage_limit);
--      -> nếu số dòng ảnh hưởng = 0: mã đã hết lượt dùng, ROLLBACK toàn bộ.
--   Việc tăng used_count bằng UPDATE ... WHERE used_count < usage_limit là một
--   phép "atomic increment có điều kiện", tránh phải SELECT ... FOR UPDATE riêng.
CREATE TABLE promotion_usages (
    usage_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    promotion_id   BIGINT NOT NULL,
    booking_id     BIGINT NOT NULL,
    used_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_promotion_per_booking (promotion_id, booking_id),
    FOREIGN KEY (promotion_id) REFERENCES promotions(promotion_id),
    FOREIGN KEY (booking_id)   REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 6. PAYMENTS - Thanh toán (UC-06)
--    [Góp ý] 1 booking có thể có nhiều bản ghi payment (thanh toán lại khi lỗi,
--    hoặc hoàn tiền REFUNDED). paid_flag + UNIQUE KEY bên dưới đảm bảo ở tầng
--    CSDL rằng tại một thời điểm chỉ có tối đa 1 payment ở trạng thái PAID cho
--    mỗi booking — tránh tình trạng 2 bản ghi cùng "thành công" do lỗi ứng dụng.
--    (Kỹ thuật: cột generated chỉ có giá trị khi PAID; UNIQUE cho phép nhiều NULL
--    nhưng không cho phép 2 giá trị 1 trùng nhau trên cùng booking_id.)
-- ----------------------------------------------------------------------------
CREATE TABLE payments (
    payment_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id       BIGINT NOT NULL,
    payment_method   ENUM('CASH','BANK_TRANSFER','E_WALLET') NOT NULL,
    amount           DECIMAL(12,2) NOT NULL,
    payment_status   ENUM('PENDING','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
    transaction_ref  VARCHAR(100),
    paid_at          DATETIME NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_flag        TINYINT GENERATED ALWAYS AS (IF(payment_status = 'PAID', 1, NULL)) VIRTUAL,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    UNIQUE KEY uq_one_paid_per_booking (booking_id, paid_flag)
);

-- ----------------------------------------------------------------------------
-- 7. REVIEWS - Đánh giá kỳ lưu trú (UC-05)
--    Ràng buộc UNIQUE(booking_id) đảm bảo TC-12: không cho đánh giá 2 lần
-- ----------------------------------------------------------------------------
CREATE TABLE reviews (
    review_id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id   BIGINT NOT NULL UNIQUE,
    guest_id     BIGINT NOT NULL,
    room_id      BIGINT NOT NULL,
    rating       TINYINT NOT NULL,
    comment      TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (rating BETWEEN 1 AND 5),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (guest_id)   REFERENCES users(user_id),
    FOREIGN KEY (room_id)    REFERENCES rooms(room_id)
);

-- ============================================================================
-- INDEXES - Tối ưu truy vấn thường dùng
-- ============================================================================
CREATE INDEX idx_bookings_room_dates ON bookings(room_id, check_in_date, check_out_date);
CREATE INDEX idx_bookings_guest      ON bookings(guest_id);
CREATE INDEX idx_bookings_status     ON bookings(booking_status);
CREATE INDEX idx_rooms_property      ON rooms(property_id);
CREATE INDEX idx_properties_host     ON properties(host_id);
CREATE INDEX idx_promotions_code     ON promotions(code);
CREATE INDEX idx_reviews_room        ON reviews(room_id);
CREATE INDEX idx_promo_usages_promo  ON promotion_usages(promotion_id);
CREATE INDEX idx_status_history_bk   ON booking_status_history(booking_id);

-- ============================================================================
-- VIEW - Báo cáo doanh thu (UC-09)
-- BR-08: chỉ tính vào doanh thu khi đơn đã COMPLETED
-- ============================================================================
CREATE VIEW v_host_revenue AS
SELECT
    p.host_id,
    r.room_id,
    r.room_name,
    DATE_FORMAT(b.checked_out_at, '%Y-%m') AS revenue_month,
    COUNT(b.booking_id)   AS total_bookings,
    SUM(b.total_amount)   AS total_revenue
FROM bookings b
JOIN rooms r       ON b.room_id = r.room_id
JOIN properties p  ON r.property_id = p.property_id
WHERE b.booking_status = 'COMPLETED'
GROUP BY p.host_id, r.room_id, r.room_name, revenue_month;

-- ============================================================================
-- GHI CHÚ NGHIỆP VỤ (áp dụng ở tầng ứng dụng, không thể enforce hết bằng SQL)
-- ============================================================================
-- TC-08: Chỉ được hủy đơn (UC-04) khi booking_status = 'PENDING'
-- TC-09: Chỉ chủ nhà sở hữu room (qua property.host_id) mới được xử lý đơn (UC-08),
--        nếu không -> trả lỗi 403
-- BR-08: Khi cron job / scheduler kiểm tra approval_deadline < NOW() và
--        booking_status vẫn là 'PENDING' -> tự động chuyển 'CANCELLED', cancelled_by = 'SYSTEM'
-- Kiểm tra phòng trống khi đặt: không tồn tại booking khác của cùng room_id có
--   booking_status IN ('PENDING','CONFIRMED','CHECKED_IN') và khoảng ngày giao nhau
--   với [check_in_date, check_out_date) của đơn mới
--
-- [Góp ý đã xử lý]
-- 1) booking_status_history.old_status/new_status nay FK về bảng danh mục
--    booking_statuses, dùng chung tập giá trị với bookings.booking_status.
-- 2) promotions.used_count: tăng bằng UPDATE ... WHERE used_count < usage_limit
--    trong cùng transaction với INSERT vào promotion_usages (xem chú thích tại
--    bảng promotion_usages) để tránh lệch số khi nhiều request chạy đồng thời.
-- 3) payments: UNIQUE KEY (booking_id, paid_flag) đảm bảo CSDL không cho phép
--    2 bản ghi cùng ở trạng thái PAID cho cùng 1 booking, dù tầng ứng dụng có lỗi.
--    Ứng dụng vẫn nên luôn lấy payment "đang hiệu lực" bằng:
--    SELECT * FROM payments WHERE booking_id = ? AND payment_status = 'PAID'
--    ORDER BY paid_at DESC LIMIT 1;
