# Đặc tả Quản lý Tác vụ dạng File (Tasks Specification)

> **Mã đặc tả:** AWS-SPEC-04  
> **Tài liệu tham chiếu:** `docs/00_AI_WORKSPACE_STANDARD.md`  
> **Thư mục trên đĩa:** `<repo_root>/tasks/`

---

## 1. Triết lý Quản lý Tác vụ dạng File (File-based Task Board)

Khác với các hệ thống Jira / Trello bên ngoài đòi hỏi API token và kết nối mạng riêng, việc quản lý tác vụ trực tiếp bằng các tệp Markdown trong repo mang lại các lợi ích vượt trội:
1. **AI Agent có thể tự đọc và tự cập nhật:** Agent nắm được việc gì đang làm, việc gì bị nghẽn mà không cần phân tích hàng trăm dòng chat.
2. **Lưu lịch sử cùng Git:** Mọi tiến độ gắn liền với từng commit cụ thể.
3. **Hoạt động Offline 100%:** Phát triển trên môi trường air-gapped hoặc máy trạm độc lập vẫn đầy đủ thông tin.

---

## 2. Các tệp tiêu chuẩn trong `tasks/`

```text
tasks/
├── active.md     # Duy nhất 1-2 tác vụ đang tập trung làm trong sprint / phiên hiện tại
├── backlog.md    # Danh sách các tính năng và cải tiến cần làm trong tương lai
├── blocked.md    # Các tác vụ tạm ngưng do thiếu thiết bị, thiếu API hoặc chờ quyết định
├── bugs.md       # Danh sách lỗi đã phát hiện kèm kịch bản tái hiện
└── done.md       # Nhật ký các tác vụ đã hoàn thành, đã kiểm tra thực tế
```

---

## 3. Cấu trúc chuẩn từng tệp

### A. `tasks/active.md`
Chỉ chứa các tác vụ đang làm dở dang hoặc phiên hiện tại đang giải quyết:
```markdown
# Active Tasks

## Task #101: Triển khai 2-way sync giữa NdevTool và handoff/latest.md

- **Trạng thái:** In Progress
- **Bắt đầu:** 2026-11-13
- **Mục tiêu:** Tự động đọc và ghi tệp handoff/latest.md mỗi khi người dùng thao tác trên NdevTool.

### Tiêu chí nghiệm thu (Acceptance Criteria):
- [x] Tạo đặc tả chuẩn trong thư mục `docs/`.
- [ ] Backend đọc được `latest.md` khi mở repo.
- [ ] Backend tự động ghi `latest.md` khi lưu handoff.
- [ ] Giao diện có nút Scaffold bộ khung chuẩn nếu repo chưa có.
- [ ] Build kiểm tra thành công 0 lỗi.

### Nhật ký kiểm tra (Verification Notes):
- Chưa test trên môi trường Linux.
```

### B. `tasks/backlog.md`
Chứa các đầu việc chờ làm, phân theo mức độ ưu tiên:
```markdown
# Backlog Tasks

## Ưu tiên cao (High)
- [ ] Thêm phím tắt mở trực tiếp thư mục `docs/` và `decisions/`.
- [ ] Hỗ trợ xem Markdown rendered ngay trong modal của NdevTool.

## Ưu tiên trung bình (Medium)
- [ ] Tích hợp bộ sinh sơ đồ Mermaid trực quan cho các ADR.
```

### C. `tasks/blocked.md`
Chứa các việc không thể tiếp tục nếu thiếu điều kiện:
```markdown
# Blocked Tasks

- **Task #082: Kiểm thử module LoRa trên phần cứng thật**
  - *Lý do nghẽn:* Bo mạch ST-LINK chưa được cắm vào cổng USB máy trạm.
  - *Người phụ trách mở khóa:* Cần cắm thiết bị và cấp nguồn 24V.
```

### D. `tasks/bugs.md`
Ghi lại các bug cần xử lý:
```markdown
# Confirmed Bugs

- **BUG-01: Cửa sổ bị thu nhỏ mất focus khi đăng nhập**
  - *Hiện tượng:* Bấm Settings -> đăng nhập Admin -> cửa sổ bị unmount.
  - *Nguyên nhân:* Thiếu import component Icon gây crash React.
  - *Trạng thái:* Đã khắc phục trong phiên 2026-11-12.
```

### E. `tasks/done.md`
Ghi nhận thành quả đã hoàn thành để dễ đối chiếu nghiệm thu:
```markdown
# Completed Tasks

## 2026-11-12
- [x] **Task #099: Đóng gói bản cài đặt độc lập Setup.exe và Portable cho Windows** (Người làm: AI + Mantainer)
  - Đã xuất file `release/NdevTool-Setup-1.0.0.exe`.
```
