# Hướng dẫn Tích hợp Chuẩn AI Workspace trong NdevTool

> **Tài liệu tham chiếu:** `docs/00_AI_WORKSPACE_STANDARD.md`  
> **Ứng dụng:** NdevTool Desktop Application

---

## 1. Cơ chế Tự động hóa trong NdevTool

NdevTool không chỉ là một ứng dụng chat bảo mật (stealth wrapper), mà còn là **Bộ điều phối (Orchestrator)** đảm bảo mọi repository tuân thủ tiêu chuẩn AI Workspace Standard:

1. **Tự động quét cấu trúc chuẩn khi nạp Repo:**
   - Khi chọn một thư mục mã nguồn (`repo.localPath`), NdevTool kiểm tra sự tồn tại của:
     - `handoff/latest.md`
     - `decisions/0000_INDEX.md`
     - `docs/00_CONTEXT.md`
     - `tasks/active.md`
     - `AGENTS.md` / `CLAUDE.md`
   - Nếu repo chưa có cấu trúc chuẩn, NdevTool hiển thị biểu tượng cảnh báo và cung cấp nút **"Scaffold AI Standard"** để tự động khởi tạo trong 1 cú nhấp chuột.

2. **Đồng bộ tự động 2 chiều `handoff/latest.md`:**
   - **Chiều Đọc (Disk -> Tool):** Nếu `handoff/latest.md` tồn tại và có thông tin mới hơn bộ nhớ tạm của Tool, NdevTool sẽ phân tích và cập nhật các trường:
     - `Current Goal`
     - `Recent Progress`
     - `Touched Files`
     - `Next Steps`
   - **Chiều Ghi (Tool -> Disk):** Bất cứ khi nào người dùng chỉnh sửa trong Handoff Modal, bấm "Lưu Handoff", kết thúc phiên, hoặc khi hàm `synthesizeHandoffSummary` tổng hợp xong: NdevTool tự động định dạng và ghi trực tiếp ra tệp `<repo.localPath>/handoff/latest.md`.

3. **Bàn giao phiên đa máy (Cross-Machine Continuity):**
   - NdevTool đóng gói Handoff và đưa vào prompt tiêm tự động khi người dùng mở phiên làm việc mới trên một máy tính khác (Windows <-> Linux).
   - Tự động xuất tệp `HANDOFF_OVERVIEW.md` trong thư mục đồng bộ đám mây (Google Drive / Git Sync).

---

## 2. Thao tác trên giao diện người dùng (UI Operations)

### A. Xem và chỉnh sửa Handoff
- Bấm tổ hợp phím tắt **`Ctrl+Shift+H`** (hoặc bấm nút **HANDOFF** trên thanh công cụ sau khi xác thực).
- Giao diện hiển thị:
  - Đường dẫn tệp đĩa: `Đã kết nối: <localPath>/handoff/latest.md`.
  - Các ô nhập dữ liệu: Mục tiêu, Tiến độ gần đây, Các tệp đã sửa, Các bước tiếp theo.
  - Nút **"Lưu Handoff"**: Cập nhật cả bộ nhớ Tool lẫn tệp `latest.md` trên đĩa.
  - Nút **"Khôi phục & Nạp Handoff vào phiên mới"**: Xóa session cũ trên máy hiện tại và bắt đầu phiên mới với ngữ cảnh bàn giao sạch sẽ.

### B. Khởi tạo cấu trúc tiêu chuẩn cho Repo mới (Scaffold Standard)
- Nếu một repository chưa có các thư mục chuẩn, ở góc trên bên cạnh tên Repo sẽ xuất hiện nút **`⚡ Scaffold AI Standard`**.
- Khi bấm nút, NdevTool sẽ tự động tạo trọn bộ thư mục và các tệp khung chuẩn (`handoff/latest.md`, `decisions/`, `docs/`, `tasks/`, `outputs/`, `AGENTS.md`, `CLAUDE.md`).
