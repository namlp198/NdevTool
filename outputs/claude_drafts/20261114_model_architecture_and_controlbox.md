# Báo cáo triển khai: Claude 5.5 Architecture & Top-Right Window Control Box

- **Thời gian:** 2026-11-14
- **Dự án:** NdevTool

## 1. Mục tiêu
1. Cấu hình hỗ trợ đầy đủ các model Claude 5.5 (`claude-sonnet-5-5`, `claude-opus-5-5`, `claude-fable-5-2`, `claude-haiku-5-5`) và cơ chế nhập Custom Model ID tự do tương tự kiến trúc của `robot_diag_ui`.
2. Bổ sung cụm điều khiển cửa sổ tiêu chuẩn OS (Minimize, Maximize / Restore, Close) ở góc trên bên phải thanh header frameless.

## 2. Các tệp đã thay đổi
1. `electron/main.ts`:
   - Thêm các IPC handlers: `window-minimize`, `window-toggle-maximize`, `window-close`, `window-is-maximized`.
   - Lắng nghe sự kiện `maximize` và `unmaximize` của `mainWindow` để gửi về Renderer qua `window-maximized-state`.
   - Cập nhật default `claudeModel` thành `'claude-sonnet-5-5'` và hỗ trợ migrate từ alias cũ.
2. `electron/preload.ts`:
   - Expose các hàm `minimizeWindow`, `toggleMaximizeWindow`, `closeWindow`, `isWindowMaximized`, `onWindowMaximizedState`.
3. `src/utils/i18n.ts`:
   - Thêm nhãn i18n cho `modelCustomOption`, `customModelPlaceholder`, `winMinimize`, `winMaximize`, `winRestore`, `winClose` cho cả tiếng Việt và tiếng Anh.
4. `src/App.tsx`:
   - Thêm biểu tượng `Minus` từ `lucide-react`.
   - Thêm cụm nút điều khiển Top-Right Window Controls (Minimize, Maximize/Restore, Close).
   - Nâng cấp Model Selector trong `SettingsModal` với danh sách model Claude 5.5 + Antigravity mới nhất, kèm ô nhập model ID tự do khi chọn tùy chỉnh.
5. `decisions/0004_claude_5_5_models_and_window_controls.md`:
   - Ghi nhận quyết định kiến trúc số 0004.
