# 0002. Chuẩn hóa cấu trúc AI Workspace Standard và đồng bộ 2 chiều `handoff/latest.md`

- **Trạng thái:** Accepted
- **Ngày quyết định:** 2026-11-13
- **Người đề xuất:** Maintainer & AI Assistant

---

## 1. Bối cảnh (Context)
Các dự án trong workspace (`robot_diag_ui`, `robot_s_rtos`, `robot_rc_rtos`...) đều áp dụng cấu trúc thư mục tiêu chuẩn (`handoff/latest.md`, `decisions/`, `docs/`, `tasks/`, `outputs/`, `AGENTS.md`, `CLAUDE.md`).
Trước đây, NdevTool chỉ lưu trữ thông tin Handoff trong tệp nội bộ `~/.ndevtool/repos/<id>.json` và file tổng quan `HANDOFF_OVERVIEW.md` trong thư mục đồng bộ đám mây, dẫn đến sự đứt gãy giữa dữ liệu trên Tool và tệp `latest.md` nằm trong chính mã nguồn git.

## 2. Quyết định (Decision)
1. Ban hành tài liệu đặc tả chuẩn toàn hệ thống trong `docs/`:
   - `docs/00_AI_WORKSPACE_STANDARD.md`
   - `docs/HANDOFF_SPECIFICATION.md`
   - `docs/DECISIONS_SPECIFICATION.md`
   - `docs/TASKS_SPECIFICATION.md`
   - `docs/AGENT_RULES_SPECIFICATION.md`
   - `docs/NDEVTOOL_INTEGRATION_GUIDE.md`
2. Hiện thực hóa cơ chế **Đồng bộ tự động 2 chiều (2-way sync)** trong NdevTool:
   - Khi nạp repo: Đọc và đồng bộ từ `<repo.localPath>/handoff/latest.md`.
   - Khi lưu handoff hoặc kết thúc phiên: Tự động ghi ra `<repo.localPath>/handoff/latest.md`.
3. Tích hợp tính năng **Scaffold AI Standard** 1-click trong NdevTool:
   - Tự động tạo bộ khung chuẩn khi người dùng mở repo mới hoặc repo chưa đạt chuẩn.

## 3. Hệ quả (Consequences)
- Bất kỳ AI Agent nào (Claude Code, Antigravity, Codex) khi mở repo ở terminal độc lập hay trên NdevTool đều đọc chung một file `handoff/latest.md`.
- Duy trì tính kỷ luật và bảo toàn ngữ cảnh hoàn hảo qua nhiều phiên làm việc và đa máy.
