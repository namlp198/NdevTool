# Active Tasks

## Task #110: Khắc phục Vòng tròn Usage Hạn Mức & Phân Tách Động Claude Code vs Gemini Antigravity

- **Trạng thái:** Completed
- **Khởi động:** 2026-11-14
- **Mục tiêu:** Sửa lỗi vòng tròn luôn báo 100% do nhầm lẫn giữa cache context token và plan usage; cập nhật động theo Engine/Model hiện tại (Claude vs Gemini) và hiển thị đúng bảng popup tương ứng.

### Tiêu chí nghiệm thu (Acceptance Criteria):
- [x] Sửa `getContextWindow(model)`: Gemini có context limit là 1,000,000 tokens (thay vì 200k).
- [x] Lọc tin nhắn assistant theo đúng `activeEngine` đang hoạt động (tránh lấy nhầm 818k token cũ của Claude khi đang dùng Gemini).
- [x] Đưa vòng tròn Claude về đo đúng % của hạn mức phiên 5 giờ (`fiveHour.percent`, thực tế là 4%, màu xanh `#3b82f6`, hoàn toàn hết lỗi 100%).
- [x] Xây dựng giao diện Popup cho Google Gemini Antigravity (Context Window 1M, Daemon Ready Status, Active Model) khi engine là Gemini.
- [x] Tuân thủ cơ chế Real/Mask ngụy trang khi nhấn Alt cho cả 2 engine.
- [x] Quyết định kiến trúc `decisions/0007_dynamic_engine_usage_ring_and_gemini_popup.md` và `0000_INDEX.md`.
- [x] Biên dịch Vite & Electron thành công 0 lỗi, đồng bộ vào `resources/app` và `release/`.
