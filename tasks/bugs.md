# Confirmed Bugs

- **BUG-20261112-01: Mất focus / unmount cửa sổ khi đăng nhập Settings**
  - *Hiện tượng:* Bấm Settings -> đăng nhập Admin -> cửa sổ bị thu nhỏ hoặc biến mất.
  - *Nguyên nhân:* Thiếu import `AlertCircle` và `CheckCircle2` từ `lucide-react` trong `src/App.tsx`.
  - *Khắc phục:* Đã bổ sung import, bọc `ErrorBoundary` quanh Settings Modal và sửa `execSync` với `{ windowsHide: true }`.
  - *Trạng thái:* Đã giải quyết.
