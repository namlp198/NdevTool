# 00_CONTEXT.md: NdevTool Architecture & Environment

## 1. Giới thiệu Dự án
- **Tên:** NdevTool (Developer Stealth Orchestration & Multi-Engine AI Companion)
- **Công nghệ chính:** Electron, React, TypeScript, TailwindCSS, Vite.
- **Mục tiêu:** Cung cấp môi trường làm việc bảo mật cao (ngụy trang mã nguồn trực tiếp, cửa sổ trong suốt không viền, hotkeys toàn cục, Watch Buffer peek), quản lý phiên làm việc đa máy (Windows/Linux/macOS) và tích hợp các engine AI (Claude Code CLI, Google Antigravity CLI, OpenAI Codex CLI).

## 2. Các thành phần chính
1. **Electron Backend (`electron/main.ts`):** Quản lý tiến trình CLI con (spawn child process với stdin/stdout stream), mã hóa dữ liệu cục bộ, đồng bộ Cloud (Google Drive API / Rclone / Git), xử lý hotkeys toàn cục, quản lý 2-way sync `handoff/latest.md` và scaffold dự án.
2. **Preload Layer (`electron/preload.ts`):** Context bridge an toàn giữa renderer và Node.js.
3. **React Frontend (`src/App.tsx`, `src/components/`):** Giao diện chính, cửa sổ ngụy trang mã nguồn Rust/C++/Assembly, Widget nổi góc màn hình, modal Handoff, modal Settings & phân quyền Super Admin.
4. **Stealth Engine (`src/utils/stealthText.ts` & `cipherEngine.ts`):** Bộ mã hóa ngụy trang ký tự thời gian thực.
5. **Standard System (`docs/` & scaffold engine):** Bộ tiêu chuẩn thống nhất cho tất cả các kho lưu trữ dự án.

## 3. Môi trường phát triển & Đóng gói
- Node.js 18+ / 20+
- Hệ điều hành hỗ trợ: Windows 10/11 x64, Ubuntu / Debian Linux x64
- Bộ cài đặt: Portable Zip (`deploy/`) và Inno Setup Installer (`release/NdevTool-Setup-1.0.0.exe`).
