# Báo cáo Khắc phục Vòng tròn Hạn Mức và Phân tách Động Claude / Gemini

**Ngày thực hiện:** 2026-11-14  
**Tác giả:** Antigravity / Codex AI Coding Agent  
**Trạng thái:** Hoàn tất & Đã kiểm thử

---

## 1. Vấn đề người dùng phản hồi
1. Người dùng đã đổi sang model Gemini nhưng vòng tròn không cập nhật, bấm vào vẫn hiển thị thông tin hạn mức của Claude.
2. Vòng tròn luôn báo 100% (đỏ rực).

---

## 2. Nguyên nhân kỹ thuật
1. **Lỗi 100%:**
   - Trong repo `NdevTool`, tin nhắn assistant trước đó của Claude tích lũy `contextTokens = 818,577` (do cache tokens cộng dồn trong CLI).
   - Hàm `getContextWindow` mặc định trả về 200,000 tokens cho các model chuẩn. Tỷ lệ `818,577 / 200,000 = 409%` bị ép về 100%.
   - Hơn nữa, vòng tròn bị lấy nhầm context token thay vì hạn mức subscription (trong thực tế máy người dùng hạn mức 5 giờ của Claude chỉ mới dùng 4%).
2. **Lỗi không cập nhật khi đổi sang Gemini:**
   - Tìm kiếm `lastAssistant` không phân biệt engine/model, dẫn đến việc luôn lấy lại tin nhắn cũ của Claude.
   - Bảng Popup chỉ chứa code cứng hiển thị API OAuth của Claude, không có giao diện tương ứng cho Gemini Antigravity.

---

## 3. Giải pháp đã thực hiện
1. **Cập nhật `getContextWindow`:**
   - Model Gemini: 1,000,000 tokens.
   - Model DeepSeek: 128,000 tokens.
   - Model Claude: 200,000 hoặc 1,000,000 tokens.
2. **Lọc chính xác tin nhắn theo Engine đang chọn:**
   - Khi ở Gemini: chỉ lấy token của tin nhắn Gemini trong repo, không lấy nhầm token của Claude.
3. **Phân nhánh hiển thị Vòng tròn Usage:**
   - **Claude:** Hiển thị đúng % hạn mức 5 giờ (`4%`, màu xanh dương `#3b82f6`).
   - **Gemini:** Hiển thị % context token phiên làm việc trên 1M tokens của Gemini (màu xanh dương).
4. **Phân nhánh giao diện Popup khi click vào vòng tròn:**
   - **Gemini:** Hiển thị bảng `Google Gemini · Antigravity`, Context Window (1M), Antigravity CLI Daemon Status, Active Model.
   - **Claude:** Hiển thị bảng `Plan usage limits · Pro`, 5-hour limit, Weekly limit.
   - Cả hai đều tuân thủ cơ chế Real/Mask ngụy trang với phím Alt.
