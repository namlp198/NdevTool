# NdevTool (Developer Stealth Orchestration & Multi-Engine AI Companion)

[![Standard](https://img.shields.io/badge/Standard-AI--Workspace--v1.0-emerald.svg)](docs/00_AI_WORKSPACE_STANDARD.md)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-blue.svg)](deploy/)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)

NdevTool là ứng dụng desktop hỗ trợ lập trình viên điều phối và làm việc liên tục với các AI Coding Agents (**Claude Code CLI**, **Google Antigravity CLI**, **OpenAI Codex CLI**) với tính năng ngụy trang mã nguồn trực tiếp (Stealth Code Camouflage), bảo vệ xác thực Super Admin, tổ hợp phím tắt toàn cục và quản lý bàn giao phiên làm việc đa máy (Cross-Machine Handoff).

---

## 1. Tính năng nổi bật

- 🛡️ **Ngụy trang mã nguồn trực tiếp (Real-time Stealth Encryption):** Gõ tiếng Việt hoặc văn bản thông thường nhưng trên màn hình hiển thị code Rust Kernel, C++ Vulkan hoặc Assembly hex. Giữ phím `Alt` (hoặc phím tắt cấu hình riêng) để xem văn bản thật.
- 👁️ **Watch Buffer (Peek Window):** Cửa sổ mờ nổi bán trong suốt hiển thị nội dung đệm, có chế độ xác nhận trước khi gửi lệnh tới AI Engine.
- 🔄 **Đồng bộ bàn giao phiên đa máy (Cross-Machine Continuity):** Tự động tổng hợp và đồng bộ 2 chiều với tệp `handoff/latest.md` trong từng repository mã nguồn.
- ⚡ **1-Click Scaffold AI Workspace Standard:** Khởi tạo bộ khung thư mục chuẩn (`handoff/`, `decisions/`, `docs/`, `tasks/`, `outputs/`, `AGENTS.md`, `CLAUDE.md`) cho bất kỳ repository nào.
- 🔐 **Bảo mật Super Admin:** Yêu cầu xác thực tài khoản Super Admin duy nhất khi mở Settings, WATCH_BUF, HANDOFF hoặc Cloud Sync bằng chuột. Bấm phím tắt riêng sẽ mở ngay.
- ☁️ **Đồng bộ Đám mây Lai (Hybrid Cloud Sync):** Hỗ trợ mã hóa AES-256-GCM đồng bộ qua thư mục cục bộ, Google Drive OAuth / Service Account và Git Repository.

---

## 2. Thứ tự đọc tài liệu đối với AI Agent

Trước khi phân tích hoặc chỉnh sửa mã nguồn, AI Agent bắt buộc phải đọc lần lượt:
1. `README.md`
2. `docs/README_AI_WORKFLOW.md`
3. `docs/00_CONTEXT.md`
4. `tasks/active.md`
5. `handoff/latest.md`
6. `decisions/0000_INDEX.md`

Xem chi tiết quy chuẩn tại: [docs/00_AI_WORKSPACE_STANDARD.md](docs/00_AI_WORKSPACE_STANDARD.md).

---

## 3. Cài đặt & Phát triển

### Yêu cầu môi trường
- Node.js 18+ hoặc 20+
- npm hoặc yarn
- Windows 10/11 x64 hoặc Ubuntu / Debian Linux x64

### Chạy từ mã nguồn
```bash
# Cài đặt phụ thuộc
npm install

# Khởi động môi trường phát triển (Vite + Electron)
npm run dev
```

### Kiểm tra & Biên dịch
```bash
# Kiểm tra kiểu TypeScript
npx tsc --noEmit

# Biên dịch frontend và Electron main process
npm run build
npm run build:electron
```

### Đóng gói bản cài đặt
```bash
# Đóng gói bản Portable (.zip)
node scripts/deploy-package.cjs

# Đóng gói bộ cài đặt Windows Setup (.exe)
node scripts/build-installer.cjs
```
File thực thi sau khi đóng gói sẽ nằm trong thư mục `release/`.

---

## 4. Cấu trúc mã nguồn

```text
NdevTool/
├── electron/         # Tiến trình Electron chính (main, preload, process management)
├── src/              # React frontend (giao diện, cipher engine, widget nổi)
├── docs/             # Tài liệu đặc tả hệ thống và quy chuẩn AI Workspace
├── decisions/        # Architecture Decision Records (ADR)
├── tasks/            # Quản lý công việc (active, backlog, blocked, bugs, done)
├── handoff/          # File bàn giao phiên làm việc (latest.md)
├── deploy/           # Script triển khai độc lập Windows và Linux
└── scripts/          # Script đóng gói và build installer
```

---

## 5. Giấy phép
Dự án được phân phối dưới giấy phép MIT.
