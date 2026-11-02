# ODauDay Stay - Frontend Base Architecture

Tài liệu hướng dẫn cấu trúc thư mục base frontend cho dự án **ODauDay Stay** (Room Booking System).
Frontend được xây dựng trên nền tảng **React 19**, **TypeScript** và **Vite 8** với cấu trúc thư mục rõ ràng, phân tách trách nhiệm theo từng tầng.

---

## 1. Công nghệ sử dụng (Tech Stack)

- **Ngôn ngữ**: TypeScript / JavaScript
- **Framework & Core**: React 19
- **Build Tool**: Vite 8.x
- **Routing**: React Router v7 (`react-router-dom`)
- **Icons**: React Bootstrap Icons (`react-bootstrap-icons`)
- **Styling**: Vanilla CSS (CSS Variables, Responsive Layout)

---

## 2. Cây thư mục base (Base Directory Structure)

```text
d:/room-book/frontend/
├── index.html                            # File HTML gốc của ứng dụng
├── package.json                          # Khai báo thư viện và scripts
├── tsconfig.json                         # Cấu hình TypeScript compiler
├── vite.config.js                        # Cấu hình Vite bundler
├── eslint.config.js                      # Cấu hình ESLint
├── README.md                             # Tài liệu cấu trúc base frontend
├── public/                               # Thư mục tài nguyên tĩnh (favicon, logo, icons, images)
└── src/
    ├── App.tsx                           # Root Component bọc Providers và Routing
    ├── main.tsx                          # Entry point khởi chạy và mount ứng dụng React
    ├── index.css                         # Hệ thống Design Tokens và CSS toàn cục
    ├── routers.tsx                       # Cấu hình định tuyến tập trung cho toàn ứng dụng
    ├── store.ts                          # Định nghĩa State Store trung tâm
    ├── constants.ts                      # Định nghĩa các hằng số và Enum dùng chung
    ├── data.ts                           # Mock data khởi tạo
    │
    ├── components/                       # Thư mục chứa các Base UI Component dùng chung
    │
    ├── contexts/                         # Thư mục chứa các React Contexts quản lý State
    │
    └── pages/                            # Thư mục chứa các màn hình giao diện
        ├── auth/                         # Các màn hình xác thực (Đăng nhập, Đăng ký)
        ├── guest/                        # Các màn hình dành cho Khách thuê (Trang chủ, Tìm kiếm, Chi tiết, Đặt phòng)
        ├── host/                         # Các màn hình dành cho Chủ nhà (Quản lý phòng, Chỗ nghỉ, Doanh thu)
        └── admin/                        # Các màn hình dành cho Quản trị viên (Quản lý người dùng, Hệ thống)
```

---

## 3. Vai trò các thư mục base (Base Folder Responsibilities)

### 3.1. `src/components/`
- Thư mục tập trung toàn bộ các **Base UI Component** dùng chung cho toàn bộ dự án (Nút bấm, Thẻ hiển thị, Modal popup, Bảng dữ liệu, Ô nhập liệu, Bộ chọn ngày, Layout khung trang,...).
- Giúp tái sử dụng tối đa giao diện, tránh viết lặp code và duy trì phong cách thiết kế đồng nhất.

### 3.2. `src/contexts/`
- Thư mục chứa các **React Context Providers** chịu trách nhiệm lưu trữ và chia sẻ State toàn cục (thông tin người dùng hiện tại, trạng thái đặt phòng,...) xuống các màn hình mà không cần truyền prop thủ công qua nhiều tầng.

### 3.3. `src/pages/`
- Thư mục chứa các màn hình giao diện chính (Views/Pages), được phân chia theo từng nhóm vai trò người dùng trong hệ thống:
  - **`auth/`**: Chứa các trang liên quan đến tài khoản và xác thực (Đăng nhập, Đăng ký, Quên mật khẩu).
  - **`guest/`**: Chứa các trang dành cho khách thuê (Trang chủ tìm kiếm, Danh sách kết quả lọc, Chi tiết phòng/chỗ nghỉ, Quy trình đặt phòng & thanh toán, Đánh giá).
  - **`host/`**: Chứa các trang quản trị dành cho chủ nhà (Quản lý danh sách chỗ nghỉ, Quản lý phòng & bảng giá, Quản lý lịch trống & đặt phòng, Thống kê doanh thu).
  - **`admin/`**: Chứa các trang quản trị hệ thống cấp cao (Quản lý danh sách người dùng, Kiểm duyệt phòng và chỗ nghỉ).

### 3.4. `public/`
- Chứa các tài nguyên tĩnh không qua xử lý bundle của Vite (Favicon, Logo thương hiệu, hình ảnh minh họa tĩnh).

---

## 4. Quy ước phát triển theo thư mục (Folder Conventions)

| Vị trí | Quy ước sử dụng |
| :--- | :--- |
| **`components/`** | Chỉ chứa các component giao diện dùng chung, có tính độc lập và tái sử dụng cao. |
| **`pages/`** | Mỗi màn hình mới phải được đặt đúng vào thư mục vai trò tương ứng (`guest/`, `host/`, `admin/`, hoặc `auth/`). |
| **`contexts/`** | Chứa các logic quản lý State toàn cục cần dùng ở nhiều trang. |
| **`routers.tsx`** | Nơi đăng ký và liên kết đường dẫn URL (Path) với các màn hình trong `pages/`. |
| **`index.css`** | Nơi lưu trữ các biến CSS toàn cục (màu sắc chủ đạo, khoảng cách, bo góc, font chữ). |

---

## 5. Lệnh thực thi cơ bản (Commands)

- **Cài đặt thư viện**:
```bash
npm install
```

- **Chạy môi trường phát triển (Dev Server)**:
```bash
npm run dev
```
*(Truy cập tại: `http://localhost:5173`)*

- **Kiểm tra mã nguồn (Linting)**:
```bash
npm run lint
```

- **Đóng gói dự án (Build Production)**:
```bash
npm run build
```
*(Thư mục xuất ra: `dist/`)*
