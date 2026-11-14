# 0004. Cấu hình Model Claude 5.5 theo robot_diag_ui & Window Control Box

- **Trạng thái:** Accepted
- **Ngày quyết định:** 2026-11-14
- **Người đề xuất:** Maintainer & NdevTool AI

---

## 1. Bối cảnh (Context)
- Ứng dụng Claude Desktop và repo mẫu `robot_diag_ui` đã hỗ trợ thế hệ model Claude 5.5 (`claude-sonnet-5-5`, `claude-opus-5-5`, `claude-fable-5-2`, `claude-haiku-5-5`), đồng thời cung cấp tính năng nhập tùy chỉnh model ID tự do (`Other model (enter id)...`).
- NdevTool trước đó còn bị hardcode các nhãn model 4.6 cũ và thiếu các nút điều khiển cửa sổ tiêu chuẩn OS (Minimize, Maximize / Restore, Close) ở góc trên bên phải thanh header frameless.

## 2. Quyết định (Decision)
1. **Kiến trúc Model linh hoạt (Tham chiếu `robot_diag_ui`):**
   - Đặt `claude-sonnet-5-5` làm model mặc định cho Engine Claude Code CLI.
   - Thêm đầy đủ thế hệ model: `claude-sonnet-5-5`, `claude-opus-5-5`, `claude-fable-5-2`, `claude-haiku-5-5`, cùng các legacy alias (`sonnet`, `opus`, `haiku`).
   - Tích hợp tùy chọn `__custom` với ô nhập model ID tự do (`Other model (enter id)...`), cho phép dùng ngay các model tương lai của Anthropic/Google mà không cần đợi cập nhật code UI.
   - Hỗ trợ di chuyển cấu hình tự động (migration) từ `sonnet` cũ sang `claude-sonnet-5-5`.
2. **Top-Right Window Control Box:**
   - Bổ sung cụm điều khiển cửa sổ ở góc top-right của header frameless:
     - **Minimize (`Minus` icon):** Thu nhỏ cửa sổ xuống Taskbar OS thông qua `window-minimize` IPC.
     - **Maximize / Fullscreen / Restore (`Square` / `Minimize2` icon):** Phóng to / khôi phục kích thước cửa sổ qua `window-toggle-maximize` IPC.
     - **Close (`X` icon):** Đóng ứng dụng qua `window-close` IPC với hiệu ứng màu đỏ.
   - Lắng nghe sự kiện `maximize` / `unmaximize` của BrowserWindow để cập nhật biểu tượng trạng thái thời gian thực.

## 3. Hệ quả (Consequences)
- Người dùng có thể sử dụng sức mạnh tối đa của Claude Sonnet 5.5, Opus 5.5 và Fable 5.2 trực tiếp trong NdevTool.
- Cải thiện đáng kể trải nghiệm tương tác với cửa sổ ứng dụng frameless trên Windows/Linux.
