# NdevTool Deployment & Installer Creation Guide

## 1. Hướng dẫn chạy các file `.cjs` để tạo bộ cài đặt (Installer `.exe` / `.run` / `.deb`)

Hệ thống đóng gói của **NdevTool** gồm **2 script `.cjs`** đặt tại thư mục `scripts/`:
1. **`scripts/deploy-package.cjs`**: Đóng gói ứng dụng đã biên dịch (`dist/` + `dist-electron/`) cùng runtime Electron thành thư mục chạy độc lập (`release/NdevTool-win32-x64` hoặc `release/NdevTool-linux-x64`) và xuất ra gói nén `.zip` / `.tar.gz`.
2. **`scripts/build-installer.cjs`**: Lấy gói nén từ bước 1 để biên dịch thành **file cài đặt thực thi độc lập**:
   - **Trên Windows**: Biên dịch mã nguồn C# WinForms bằng trình biên dịch `.NET Framework csc.exe` có sẵn trong Windows để nhúng toàn bộ payload vào 1 file duy nhất **`release/NdevTool-Setup-1.0.0.exe`** (giao diện Setup Wizard tiếng Anh 100%).
   - **Trên Linux**: Đóng gói thành file tự giải nén **`release/NdevTool-Setup-1.0.0-linux-x64.run`** và gói Debian/Ubuntu **`release/ndevtool_1.0.0_amd64.deb`** (nếu máy có `dpkg-deb`).

---

### Cách 1: Chạy trực tiếp từng file `.cjs` bằng `node` (Từng bước chi tiết)

Mở Terminal (`PowerShell` / `CMD` trên Windows hoặc `bash` trên Linux) tại thư mục gốc của dự án (`NdevTool`) và chạy lần lượt 3 lệnh sau:

```bash
# Bước 1: Build mã nguồn Frontend (Vite React) và Backend (Electron TypeScript)
npm run build

# Bước 2: Chạy deploy-package.cjs để tạo thư mục Portable và file nén .zip / .tar.gz
node scripts/deploy-package.cjs

# Bước 3: Chạy build-installer.cjs để đóng gói thành file cài đặt Setup (.exe trên Windows / .run & .deb trên Linux)
node scripts/build-installer.cjs
```

> **Mẹo khi chỉ muốn build lại nhanh file `NdevTool-Setup-1.0.0.exe`** (khi đã có sẵn file `.zip` trong `release/`):
> Bạn chỉ cần chạy duy nhất lệnh:
> ```bash
> node scripts/build-installer.cjs
> ```

---

### Cách 2: Chạy bằng lệnh gộp `npm` hoặc Script tự động (`.ps1` / `.sh`)

- **Chạy 1 lệnh duy nhất (Tự động chạy Bước 1 -> Bước 2 -> Bước 3)**:
  ```bash
  npm run deploy
  ```
- **Chỉ chạy riêng `build-installer.cjs` qua npm**:
  ```bash
  npm run deploy:installer
  ```
- **Chạy qua Script PowerShell (Windows)**:
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\deploy\deploy-windows.ps1
  ```
- **Chạy qua Script Bash (Linux)**:
  ```bash
  chmod +x ./deploy/deploy-linux.sh
  ./deploy/deploy-linux.sh
  ```

---

## 2. Danh sách các file đầu ra trong thư mục `release/`

### A. Trên Windows (`win32-x64`)
- **File cài đặt `.exe` độc lập (English Setup Wizard + Silent Install)**:
  - **`release/NdevTool-Setup-1.0.0.exe`**
  - *Chế độ giao diện (GUI - 100% English)*: Nhấn đúp chuột để mở trình cài đặt (`NdevTool v1.0.0 :: Setup Installer`), chọn thư mục cài đặt (mặc định `%LOCALAPPDATA%\Programs\NdevTool`), tùy chọn tạo Desktop Shortcut, Start Menu Shortcut, tự đăng ký Uninstaller vào Windows Installed Apps và khởi chạy NdevTool.
  - *Chế độ cài ngầm (Silent Mode)*:
    ```powershell
    .\release\NdevTool-Setup-1.0.0.exe /S
    # Hoặc chỉ định thư mục cài đặt tùy ý:
    .\release\NdevTool-Setup-1.0.0.exe /S /D="C:\Tools\NdevTool"
    ```
- **Bản chạy trực tiếp không cần cài (Portable)**:
  - File thực thi: **`release/NdevTool-win32-x64/NdevTool.exe`**
  - Chạy ở chế độ Icon góc màn hình: `release/NdevTool-win32-x64/Start-NdevTool-CornerWidget.bat`
  - Tạo nhanh Shortcut ra Desktop: `release/NdevTool-win32-x64/Create-Desktop-Shortcut.bat`
- **File nén Portable `.zip`**:
  - `release/NdevTool-v1.0.0-win32-x64-portable.zip`

### B. Trên Linux (`linux-x64`)
- **File cài đặt tự giải nén (`.run`)**:
  - **`release/NdevTool-Setup-1.0.0-linux-x64.run`**
  - Chạy cài đặt: `chmod +x release/NdevTool-Setup-1.0.0-linux-x64.run && ./release/NdevTool-Setup-1.0.0-linux-x64.run`
  - Gỡ cài đặt: `./release/NdevTool-Setup-1.0.0-linux-x64.run --uninstall`
- **Gói cài đặt Debian/Ubuntu (`.deb`)**:
  - **`release/ndevtool_1.0.0_amd64.deb`**
  - Chạy cài đặt: `sudo dpkg -i release/ndevtool_1.0.0_amd64.deb`
- **Bản chạy trực tiếp (Portable)**:
  - `release/NdevTool-linux-x64/ndevtool`

---

## 3. Tài khoản Super Admin & Hệ thống 7 Phím tắt tùy chỉnh (`Settings -> Mục 3`)

- **Tài khoản Super Admin mặc định lần đầu**:
  - **Username**: `admin`
  - **Password**: `admin`
  - *(Đổi mật khẩu riêng tại `Settings -> Mục 4`)*
- **Toàn bộ 7 phím tắt đều có thể thay đổi tùy ý trong `Settings -> Mục 3`**:
  0. **Phím nhấn giữ Giải mã / Mã hóa ngược (Mặc định: `Alt` — có thể đổi sang `Control`, `Shift`, `CapsLock`, `Tab`, `F2`, `` ` `` hoặc phím/tổ hợp phím bất kỳ)**:
     - **Tại cửa sổ chính (Main UI)**: Nhấn giữ để giải mã tạm thời toàn bộ giao diện (hiển thị chữ thật, ảnh thật, tên Repo & cây Session thật).
     - **Tại cửa sổ `WATCH_BUF` (`SOI_TEXT`) khi đang focus**: Nhấn giữ để **mã hóa ngược** toàn bộ chữ đang nhập và tin nhắn trong `WATCH_BUF` thành code Kernel/Rust.
  1. **`Ctrl + Shift + A`**: Ẩn / Hiện nhanh toàn bộ phần mềm (Stealth Boss Key, ẩn cả trên Taskbar).
  2. **`Ctrl + Shift + W`**: Thu nhỏ thành Icon góc màn hình / Phóng to lại.
  3. **`Ctrl + Shift + Q`**: Thoát khẩn cấp toàn bộ phần mềm ngay lập tức.
  4. **`Ctrl + Shift + P`**: Mở / Đóng nhanh cửa sổ `WATCH_BUF` (`SOI_TEXT`) **ngay lập tức không cần đăng nhập**.
  5. **`Ctrl + Shift + H`**: Mở / Đóng nhanh hộp thoại `HANDOFF SUMMARY` **ngay lập tức không cần đăng nhập**.
  6. **`Ctrl + Shift + S`**: Kích hoạt đồng bộ Cloud `SYNC` **ngay lập tức không cần đăng nhập**.
