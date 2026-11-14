# 0006. Hợp nhất Vòng tròn Usage Hạn Mức (Usage Ring) & Bảng Popup Plan Usage Limits với Real/Mask Stealth Logic

- **Trạng thái:** Accepted
- **Ngày:** 2026-11-14
- **Người đề xuất:** Antigravity / Codex AI Agent

## 1. Bối cảnh
- Trước đây phía dưới ô soạn thảo chính có dòng nhắc phím tắt (`Hold [ALT] to peek | [Ctrl+V] Paste image/file | [Enter] Execute | [Shift+Enter] Newline BUF_LEN: ...`). Người dùng thấy dòng này rườm rà và không cần thiết.
- Đồng thời người dùng mong muốn có 1 vòng tròn nhỏ hiển thị hạn mức (Usage Ring) tương tự Claude Desktop / Cursor ở góc dưới. Khi click vào vòng tròn này sẽ bật popup bảng hiển thị chi tiết hạn mức gói đăng ký (5-hour limit và Weekly · all models) với thanh tiến trình xanh dương và thời gian reset tương ứng.
- Toàn bộ nội dung hiển thị trong popup và vòng tròn phải tuân thủ triệt để logic ngụy trang Real / Mask (`isAltHeld`): khi thả Alt hiển thị mã hóa kernel/MMU/IRQ, khi giữ Alt hiển thị văn bản Claude Pro thực tế.

## 2. Quyết định
1. **Loại bỏ hoàn toàn dòng gợi ý phím tắt:**
   - Xóa bỏ khối `inputHint`, `altHeldNotice` và `bufLenLabel` dưới thanh công cụ input.
2. **Hợp nhất thành 1 Nút Vòng tròn Usage Hạn Mức duy nhất:**
   - Thay thế các vòng 5h/7d cũ bằng 1 nút SVG Ring hình tròn gọn gàng kích thước 20x20px tại góc phải (`ml-auto`).
   - Vòng tròn hiển thị tỷ lệ % của hạn mức phiên 5 giờ (`fiveHour.percent`).
3. **Bảng Floating Popover Card hiển thị hạn mức (Plan Usage Limits):**
   - Click vào nút Usage Ring sẽ toggle mở/đóng popup card ngay phía trên nút (`absolute bottom-full right-0`).
   - Xử lý click outside và phím `Escape` để tự động đóng popup.
   - Hỗ trợ nút `See all →` / `0x7F_SYNC →` để người dùng click refresh dữ liệu usage từ Anthropic OAuth API bất kỳ lúc nào.
4. **Cơ chế Stealth Real / Mask:**
   - **Khi thả Alt (`isAltHeld === false`):**
     - Header: `RING0_QUOTA_WATCH :: MMU_LIMITS` / `0x7F_SYNC →`
     - Limit 1: `IRQ_WINDOW_5H` / `RESET_VEC @ 0x{hex}  {percent}%`
     - Limit 2: `BURST_CYCLE_7D` / `EPOCH_TICK @ 0x{hex}  {percent}%`
     - Title tooltip: `RING0_QUOTA_WATCH`
   - **Khi giữ Alt (`isAltHeld === true`):**
     - Header: `Plan usage limits · Pro` / `See all →`
     - Limit 1: `5-hour limit` / `Resets at {time}  {percent}%`
     - Limit 2: `Weekly · all models` / `Resets {day} {time}  {percent}%`
     - Thanh tiến trình: Màu xanh lam `#3b82f6` bo góc tròn trên rãnh xám `#2d333f`.

## 3. Hệ quả
- Giao diện sạch sẽ, chuyên nghiệp, chuẩn theo thiết kế của Claude Desktop nhưng vẫn đảm bảo tính ngụy trang tuyệt đối khi làm việc trong môi trường giám sát.
