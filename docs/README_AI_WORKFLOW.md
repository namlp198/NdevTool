# README_AI_WORKFLOW: Quy trình làm việc AI trong NdevTool

## 1. Nguyên tắc cơ bản
- Mọi Agent khi vào làm việc trong NdevTool phải đọc kỹ:
  1. `README.md`
  2. `docs/README_AI_WORKFLOW.md`
  3. `docs/00_CONTEXT.md`
  4. `tasks/active.md`
  5. `handoff/latest.md`
  6. `decisions/0000_INDEX.md`

## 2. Quy trình can thiệp mã nguồn
- Chỉ tập trung giải quyết đúng yêu cầu được giao trong `tasks/active.md`.
- Khi bổ sung tính năng mới hoặc sửa bug, luôn kiểm tra `npx tsc --noEmit` và `npm run build` trước khi báo cáo hoàn thành.
- Nếu can thiệp vào IPC giữa Electron và Frontend: Phải cập nhật đồng thời ở `electron/main.ts`, `electron/preload.ts`, và `src/types.ts`.
- Cập nhật `handoff/latest.md` trước khi kết thúc phiên.
