# 0008. Thiết kế Cấu hình Phông chữ, Kích thước Chữ & Kiểu Phong cách Hiển thị (Typography & Display Styles)

- **Trạng thái:** Accepted
- **Ngày:** 2026-11-20
- **Người đề xuất:** Antigravity / Codex AI Agent

## 1. Bối cảnh
- NdevTool là môi trường làm việc bảo mật cao dành cho developer với giao diện mã nguồn ngụy trang (Rust, C++, Assembly) và console stream thời gian thực.
- Người dùng mong muốn có khả năng tùy chỉnh phông chữ lập trình ưa thích (Font Family), kích thước chữ (Font Size) phù hợp với độ phân giải màn hình (FullHD, 2K, 4K) và các phong cách hiển thị khác nhau (style chữ phát sáng neon, sắc nét tương phản cao, hay phong cách terminal hoài niệm).

## 2. Quyết định
1. **Kiến trúc CSS Variables động (`applyTypographySettings`):**
   - Không can thiệp tĩnh vào từng class Tailwind, thay vào đó tiêm trực tiếp các biến CSS vào `:root` (`document.documentElement`):
     - `--app-font-family`: Font family monospace.
     - `--app-font-size`: Kích thước font chữ (11px, 12px, 13px, 14px, 16px).
     - `--app-line-height`: Khoảng cách dòng (1.3, 1.5, 1.75).
     - `--app-font-weight`: Độ đậm chữ (400 Regular, 500 Medium, 600 Semibold, 700 Bold).
     - `--app-text-shadow`: Hiệu ứng phát sáng neon / matrix.
     - `--app-letter-spacing`: Khoảng cách giữa các ký tự.
   - Khi người dùng thay đổi hoặc lưu cài đặt, toàn bộ ứng dụng (khung chat, console ngụy trang, sidebar, popup) tự động áp dụng tức thì.
2. **Hỗ trợ Danh sách Phông chữ Lập trình Chuyên nghiệp:**
   - Tải sẵn từ Google Fonts: `JetBrains Mono`, `Fira Code`, `Roboto Mono`, `Source Code Pro`.
   - Hỗ trợ các font hệ thống: `Cascadia Code`, `Consolas`, `Courier New`.
   - Cho phép nhập font tùy biến cài đặt cục bộ trên máy người dùng (`Custom System Font`).
3. **Các Phong cách Hiển thị (Display Style Variants):**
   - **Chuẩn Hacker (Standard Clean):** Gọn gàng, độ tương phản chuẩn.
   - **Ma trận phát sáng (Matrix Green Glow):** Hiệu ứng text-shadow xanh ma trận cyberpunk.
   - **Cyber Neon (Cyber Cyan Glow):** Hiệu ứng phát sáng cyan băng tuyết thời thượng.
   - **Siêu sắc nét tương phản cao (High-Contrast Crisp):** Tăng nhẹ letter-spacing và độ sắc nét để đọc code nhanh.
   - **Terminal cổ điển hổ phách (Vintage Amber CRT):** Sắc hổ phách hoài niệm ấm áp.
4. **Khung Xem trước Trực tiếp (Live Typography Preview Box):**
   - Tích hợp ngay trong Settings Modal để người dùng có thể thử nghiệm trực quan font, size, line-height và style chữ trước khi bấm "Lưu & Áp dụng".

## 3. Hệ quả
- Ứng dụng mang tính cá nhân hóa cao, dễ đọc trên mọi kích thước màn hình mà vẫn giữ trọn vẹn phong cách stealth hacker và độ mượt mà cao nhất.
