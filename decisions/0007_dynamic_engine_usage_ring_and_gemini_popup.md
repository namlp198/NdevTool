# 0007. Khắc phục Vòng tròn Usage Hạn mức & Tách biệt Động giữa Claude Code và Gemini Antigravity

- **Trạng thái:** Accepted
- **Ngày:** 2026-11-14
- **Người đề xuất:** Antigravity / Codex AI Agent

## 1. Bối cảnh & Nguyên nhân lỗi
1. **Lỗi vòng tròn luôn báo 100%:**
   - Trong repo `NdevTool`, tin nhắn assistant trước đó của Claude lưu `contextTokens = 818,577` (do Claude Code CLI cộng dồn token cache qua nhiều lần gọi tool).
   - Hàm `getContextWindow(model)` chỉ gán 200,000 tokens cho các model không có đuôi `[1m]`.
   - Kết quả: `818,577 / 200,000 = 4.09` -> bị clamp về `1.0` (100%), khiến vòng tròn luôn đỏ rực 100% bất kể người dùng chọn model nào.
   - Hơn nữa, chiếc vòng tròn này bị gán đo token context thay vì hiển thị % hạn mức subscription (Claude 5-hour limit 4%).
2. **Lỗi đổi sang Gemini nhưng vòng tròn không cập nhật và popup vẫn hiện Claude:**
   - Khi người dùng đổi sang engine Antigravity hoặc model Gemini, mã nguồn vẫn tìm tin nhắn assistant gần nhất trong repo mà không lọc theo engine hiện tại. Vì tin nhắn gần nhất thuộc về Claude, nó lấy luôn `modelUsed = 'claude-sonnet-5-5'` và số token cũ của Claude.
   - Bảng Popover Popup bị fix cứng code hiển thị `planUsage` của Claude OAuth API (`5-hour limit`, `Weekly · all models`), hoàn toàn không có giao diện tương ứng cho Gemini.

## 2. Quyết định
1. **Cập nhật `getContextWindow(model)`:**
   - Nhận diện các model Google Gemini (Gemini 1.5 Pro, Flash, Gemini 3.8, Gemini 4...) và gán context window chuẩn là **1,000,000 tokens**.
   - Hỗ trợ model DeepSeek (128,000 tokens) và Claude (200,000 / 1,000,000 tokens).
2. **Động hóa Vòng tròn Usage Ring theo Engine & Model Đang Hoạt Động:**
   - Lọc chính xác tin nhắn assistant của engine đang chọn (`currentEngine` / `isGemini`), tránh lấy nhầm token của engine khác.
   - **Claude Code:** Vòng tròn hiển thị % của `fiveHour.percent` (hiện tại là 4%, màu xanh `#3b82f6`, hoàn toàn không bị 100%).
   - **Gemini / Antigravity:** Vòng tròn hiển thị tỷ lệ context token phiên hiện tại trên tổng 1,000,000 tokens của Gemini (màu xanh dương `#3b82f6` / xanh lá).
3. **Phân nhánh giao diện Popup theo Engine Active:**
   - **Khi ở Gemini (`isGemini === true`):**
     - Header: `Google Gemini · Antigravity` / Model tag.
     - Mục 1: `Context window` (${usedTokens} / 1M tokens) kèm progress bar.
     - Mục 2: `Antigravity CLI Daemon` (Connected · Ready) kèm thanh trạng thái.
     - Mục 3: Active Model chi tiết.
   - **Khi ở Claude (`activeEng === 'claude-code'`):**
     - Hiển thị bảng Claude Plan Usage Limits (`5-hour limit`, `Weekly · all models`, scoped limits).
4. **Duy trì tuyệt đối cơ chế Stealth Real / Mask (`isAltHeld`):**
   - Khi thả Alt: Chuyển toàn bộ thành mã hóa kernel `RING0_QUOTA_WATCH :: GEMINI_MMU`, `CONTEXT_MMU_MAP`, `BURST_IO_LIMIT`.
   - Khi giữ Alt: Hiển thị đầy đủ thông tin chuẩn của Gemini hoặc Claude.
