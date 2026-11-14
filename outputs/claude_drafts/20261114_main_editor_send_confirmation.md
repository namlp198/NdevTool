# Báo cáo triển khai: Hộp thoại xác nhận trước khi gửi cho khung soạn thảo chính

- **Thời gian:** 2026-11-14
- **Dự án:** NdevTool

## 1. Yêu cầu người dùng
Đồng bộ cơ chế xác nhận gửi: Ở khung soạn thảo chính, khi nhấn Enter hoặc bấm nút gửi tin nhắn, cần xuất hiện pop-up xác nhận trước khi gửi tương tự như cửa sổ `WATCH_BUF`.

## 2. Các điểm thay đổi
1. `src/utils/i18n.ts`:
   - Thêm các khóa nhãn i18n: `mainConfirmSendTitle`, `mainConfirmSendDesc`, `mainConfirmSendBtn`, `mainConfirmCancelBtn` cho cả tiếng Việt và tiếng Anh.
2. `src/App.tsx`:
   - Thêm state `showMainSendConfirmModal` và ref `confirmSendBtnRef`.
   - Tách logic gửi tin nhắn thành:
     - `handleRequestSendPrompt()`: Kiểm tra điều kiện và mở modal xác nhận.
     - `executeSendPrompt()`: Đóng modal và thực hiện dispatch lệnh tới AI Engine.
   - Gắn sự kiện `onKeyDown` (phím `Enter` không kèm `Shift`) của textarea và `onClick` của nút gửi vào `handleRequestSendPrompt()`.
   - Khi modal mở, tự động focus vào nút xác nhận "▶ Gửi ngay (Enter)", hỗ trợ phím `Enter` để gửi ngay và `Escape` để hủy quay lại soạn thảo.
   - Giao diện modal hiển thị Target Engine & Model, nội dung xem trước tin nhắn và danh sách tệp đính kèm.
3. `decisions/0005_main_editor_send_confirmation_modal.md`:
   - Ghi nhận quyết định kiến trúc số 0005.
