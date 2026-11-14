# 0005. Hộp thoại xác nhận trước khi gửi tin nhắn ở khung soạn thảo chính

- **Trạng thái:** Accepted
- **Ngày quyết định:** 2026-11-14
- **Người đề xuất:** Maintainer & NdevTool AI

---

## 1. Bối cảnh (Context)
- Trước đây, việc gửi tin nhắn từ khung phụ `WATCH_BUF` (Peek Inspector) đã có hộp thoại pop-up xác nhận trước khi dispatch tới AI Engine.
- Tuy nhiên, ở khung soạn thảo chính của NdevTool, thao tác nhấn `Enter` hoặc click nút `▶ Gửi` (`t.execSyscallBtn`) sẽ lập tức gửi tin nhắn đi mà chưa có bước xác nhận, tiềm ẩn nguy cơ vô tình gửi lệnh khi chưa soạn xong hoặc gửi nhầm nội dung/tệp đính kèm.

## 2. Quyết định (Decision)
1. **Thêm bước xác nhận gửi (Send Confirmation Modal) cho khung soạn thảo chính:**
   - Khi người dùng nhấn `Enter` (không kèm `Shift`) hoặc click nút gửi, hàm `handleRequestSendPrompt` được kích hoạt và hiển thị modal `showMainSendConfirmModal`.
   - Modal hiển thị đầy đủ thông tin:
     - Tên Engine và Model tiếp nhận (`activeEngine.toUpperCase()` :: `activeModelDisplay`).
     - Nội dung xem trước tin nhắn (Message Preview) kèm số lượng ký tự.
     - Danh sách các tệp/ảnh đính kèm đang chờ gửi (nếu có).
     - Phím tắt tương tác: `Enter` để xác nhận gửi ngay (`executeSendPrompt`), `Escape` để hủy và quay lại tiếp tục chỉnh sửa.
2. **Tối ưu luồng gửi từ WATCH_BUF:**
   - Tin nhắn kích hoạt từ `WATCH_BUF` qua IPC `triggerSendFromPeek` đã được xác nhận tại cửa sổ Peek, nên sẽ gọi trực tiếp `executeSendPrompt` mà không kích hoạt xác nhận kép.

## 3. Hệ quả (Consequences)
- Ngăn chặn hoàn toàn việc gửi nhầm prompt hoặc tệp đính kèm không mong muốn.
- Đồng bộ trải nghiệm người dùng và tính an toàn bảo mật giữa khung soạn thảo chính và cửa sổ phụ `WATCH_BUF`.
