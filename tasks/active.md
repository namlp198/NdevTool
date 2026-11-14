# Active Tasks

## Task #108: Triển khai Hộp thoại xác nhận trước khi gửi ở khung soạn thảo chính

- **Trạng thái:** Completed
- **Khởi động:** 2026-11-14
- **Mục tiêu:** Đồng bộ tính năng xác nhận gửi tin nhắn giữa khung soạn thảo chính và cửa sổ phụ `WATCH_BUF`.

### Tiêu chí nghiệm thu (Acceptance Criteria):
- [x] Thêm định nghĩa và bản dịch i18n cho các nhãn xác nhận gửi trong `src/utils/i18n.ts`.
- [x] Tạo `handleRequestSendPrompt()` và `executeSendPrompt()` trong `src/App.tsx`.
- [x] Thêm modal xác nhận `showMainSendConfirmModal` hiển thị Target Engine & Model, nội dung xem trước và tệp đính kèm.
- [x] Hỗ trợ phím tắt `Enter` để gửi ngay và `Escape` để hủy quay lại sửa tiếp.
- [x] Tạo quyết định kiến trúc `decisions/0005_main_editor_send_confirmation_modal.md`.
- [x] Biên dịch và đóng gói thành công 0 lỗi vào `resources/app` và `release/`.
