# Đặc tả Ghi nhận Quyết định Kiến trúc (ADR - Decisions Specification)

> **Mã đặc tả:** AWS-SPEC-03  
> **Tài liệu tham chiếu:** `docs/00_AI_WORKSPACE_STANDARD.md`  
> **Thư mục trên đĩa:** `<repo_root>/decisions/`

---

## 1. Mục đích của Thư mục `decisions/`

Trong quá trình phát triển dự án với AI, một trong những nguy cơ lớn nhất là **"Kiến trúc bị trôi dạt" (Architecture Drift)**:
- Agent này chọn thư viện A, sang phiên sau Agent khác lại đổi sang thư viện B.
- Agent tự ý sửa cấu trúc giao tiếp phần cứng hoặc cấu trúc dữ liệu cốt lõi mà không biết lý do tại sao kiến trúc cũ lại được thiết kế như vậy.

Thư mục `decisions/` (Architecture Decision Records - ADR) đóng vai trò là **bộ luật bất biến** của dự án. Mọi thay đổi kiến trúc lớn bắt buộc phải có một bản ghi tại đây trước khi được hiện thực hóa trong code.

---

## 2. Cấu trúc tệp mục lục: `decisions/0000_INDEX.md`

Tệp `0000_INDEX.md` là bảng chỉ mục tất cả các quyết định kiến trúc đã hoặc đang được xem xét trong repo.

```markdown
# Decision Index

| ID | Title | Status | Date |
|---|---|---|---|
| 0001 | Kiến trúc đồng bộ trạng thái giữa các Node | Accepted | 2026-11-12 |
| 0002 | Lựa chọn Engine AI và cơ chế dự phòng CLI | Accepted | 2026-11-13 |
| 0003 | Giao thức mã hóa AES-256-GCM cho Cloud Sync | Proposed | 2026-11-14 |
```

### Các trạng thái chuẩn (Status Lifecycle):
- **`Proposed`**: Đang được đề xuất, thảo luận hoặc lập kế hoạch thử nghiệm (Spike).
- **`Accepted`**: Đã được chấp thuận chính thức bởi Tech Lead / Maintainer và đang áp dụng.
- **`Superseded`**: Đã bị thay thế bởi một quyết định mới hơn (cần ghi rõ: *Superseded by 0005*).
- **`Rejected`**: Đã bị từ chối sau khi xem xét hoặc thử nghiệm thất bại.

---

## 3. Cấu trúc chuẩn của một tệp quyết định (`0001_<slug>.md`)

Mỗi quyết định được lưu trong một file Markdown độc lập với định dạng tên `NNNN_<slug>.md` (ví dụ: `0001_stealth_encryption_pipeline.md`):

```markdown
# 0001. <Tiêu đề Quyết định Ngắn gọn>

- **Trạng thái:** Accepted / Proposed / Superseded
- **Ngày quyết định:** YYYY-MM-DD
- **Người đề xuất:** @username hoặc AI Agent phối hợp cùng Maintainer
- **Quyết định liên quan:** (Nếu có)

---

## 1. Bối cảnh (Context)
Vấn đề kỹ thuật đang gặp phải là gì? Tại sao giải pháp hiện tại không còn đáp ứng được? Những ràng buộc nào cần tuân thủ (hiệu năng, bộ nhớ, môi trường hệ điều hành, an toàn)?

## 2. Các phương án xem xét (Options Considered)
Liệt kê ít nhất 2 phương án khả thi kèm ưu và nhược điểm của từng phương án:
- **Phương án A:** ...
  - Ưu điểm: ...
  - Nhược điểm: ...
- **Phương án B:** ...

## 3. Quyết định (Decision)
Phương án nào được chọn và các chi tiết kỹ thuật cốt lõi được thống nhất.

## 4. Hệ quả và Đánh đổi (Consequences & Trade-offs)
- **Tác động tích cực:** Đạt được mục tiêu gì?
- **Đánh đổi / Hạn chế chấp nhận:** Tăng kích thước bộ nhớ, phụ thuộc thêm thư viện gì?
- **Quy tắc tuân thủ (Compliance Rule):** AI Agent khi viết mã trong các module liên quan bắt buộc phải tuân theo nguyên tắc nào?
```
