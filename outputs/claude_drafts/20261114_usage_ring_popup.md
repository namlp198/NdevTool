# Báo cáo Triển khai Vòng tròn Usage Hạn Mức và Bảng Popup Plan Usage Limits

**Ngày thực hiện:** 2026-11-14  
**Tác giả:** Antigravity / Codex AI Coding Agent  
**Trạng thái:** Hoàn thành & Đã đóng gói (Release Ready)

---

## 1. Yêu cầu của người dùng
1. Bỏ dòng gợi ý phím tắt phía dưới ô soạn thảo (`Hold [ALT] to peek | [Ctrl+V] Paste image/file | [Enter] Execute | [Shift+Enter] Newline BUF_LEN: ...`).
2. Thêm 1 vòng tròn usage hạn mức (Usage Ring Button), khi bấm vào sẽ hiển thị bảng popup hạn mức (5-hour limit và Weekly · all models) giống Claude Desktop.
3. Tuân thủ triệt để logic ngụy trang Real / Mask (`isAltHeld`):
   - Khi không giữ Alt: hiển thị dạng kernel MMU/IRQ.
   - Khi giữ Alt: hiển thị đầy đủ văn bản Claude Pro Plan Limits.

---

## 2. Các thay đổi đã thực hiện
1. **`src/App.tsx`:**
   - Xóa bỏ khối chứa văn bản gợi ý phím tắt `inputHint`, `altHeldNotice` và `bufLenLabel`.
   - Xóa bỏ các vòng tròn 5h/7d rời rạc cũ.
   - Thêm hàm `formatResetTime(isoStr, isWeekly)` để định dạng thời gian reset chuẩn xác (`Resets at 7:40 PM` và `Resets Tue 5:00 AM`).
   - Tạo nút **Usage Ring Button** hình tròn nhỏ gọn với SVG circular progress bar đường kính 20px, màu xanh `#3b82f6` đại diện cho % hạn mức phiên 5h.
   - Xây dựng **Plan Usage Limits Popover Card** nổi lên ngay phía trên nút khi click:
     - Header: `Plan usage limits · Pro` kèm nút `See all →` (cho phép bấm để refresh API bất kỳ lúc nào).
     - Hạn mức 5 giờ (`5-hour limit`) kèm thời gian reset và progress bar xanh dương.
     - Hạn mức tuần (`Weekly · all models`) kèm thời gian reset và progress bar xanh dương.
     - Khi thả phím Alt: Tự động mã hóa thành `RING0_QUOTA_WATCH :: MMU_LIMITS`, `IRQ_WINDOW_5H`, `RESET_VEC`, `BURST_CYCLE_7D`, `EPOCH_TICK`.
   - Thêm hook lắng nghe click outside và phím `Escape` để tự động đóng popup khi người dùng click ra ngoài hoặc bấm ESC.
2. **Build & Deploy:**
   - Đã biên dịch Vite (`npm run build`) và TypeScript Electron (`npm run build:electron`) thành công 0 lỗi.
   - Đã đồng bộ sang `C:\Users\ndev\AppData\Local\Programs\NdevTool\resources\app\`.
   - Đã đóng gói lại bản portable zip trong `release/NdevTool-v1.0.0-win32-x64-portable.zip`.
