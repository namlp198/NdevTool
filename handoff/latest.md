# Latest Handoff

## Date

2026-11-20

## Machine / branch

- Machine: `win32-DESKTOP-LJ5ON20`
- Branch: `main`
- Updated: 2026-11-20T18:48:00.000Z

## Current Goal

Bổ sung phần cài đặt phông chữ (Font Family), kích thước chữ (Font Size), và các phong cách hiển thị chữ (Display Style Variants) kèm khung Live Preview trực tiếp trong Settings Modal.

## Latest change / Recent progress

- Thêm `TypographyConfig` vào `AppSettings` trong `src/types.ts`.
- Tạo `src/utils/typography.ts` với hàm `applyTypographySettings()` tiêm các CSS variables (`--app-font-family`, `--app-font-size`, `--app-line-height`, `--app-font-weight`, `--app-text-shadow`, `--app-letter-spacing`) vào root element.
- Tích hợp các font lập trình chuyên nghiệp: `JetBrains Mono`, `Fira Code`, `Cascadia Code`, `Consolas`, `Roboto Mono`, `Source Code Pro`, `Courier New` và tùy chọn nhập `Custom System Font`.
- Hỗ trợ 5 mức kích thước font: 11px (Compact), 12px (Standard NdevTool), 13px (Readable), 14px (Spacious), 16px (4K / Large Display).
- Hỗ trợ 5 phong cách & hiệu ứng chữ:
  1. Standard Clean (Hacker chuẩn sắc nét)
  2. Matrix Green Glow (Ma trận phát sáng cyberpunk)
  3. Cyber Neon (Ánh sáng xanh băng tuyết cyan)
  4. High-Contrast Crisp (Tương phản cao sắc cạnh, letter-spacing +0.035em)
  5. Vintage Amber CRT (Terminal cổ điển sắc hổ phách)
- Hỗ trợ tùy chỉnh Line Height (1.3, 1.5, 1.75) và Font Weight (400, 500, 600, 700).
- Thêm khung **Live Typography Preview Box** ngay trong Settings Modal hiển thị thời gian thực đoạn code và văn bản mẫu.
- Thêm bản dịch i18n đầy đủ cho tiếng Việt và tiếng Anh.
- Tạo quyết định kiến trúc: `decisions/0008_custom_typography_font_size_and_display_styles.md`.
- Xuất tài liệu: `outputs/claude_drafts/20261120_typography_settings.md`.
- Đã build thành công 0 lỗi và đồng bộ vào `resources/app` và `release/`.

## Touched Files

- `src/types.ts`
- `src/utils/typography.ts`
- `src/utils/i18n.ts`
- `src/index.css`
- `index.html`
- `src/App.tsx`
- `decisions/0000_INDEX.md`
- `decisions/0008_custom_typography_font_size_and_display_styles.md`
- `outputs/claude_drafts/20261120_typography_settings.md`
- `tasks/active.md`
- `handoff/latest.md`

## Next

Bấm `Ctrl+R` trên cửa sổ NdevTool (hoặc khởi động lại app) và mở Settings để trải nghiệm tính năng tùy biến phông chữ, kích thước và phong cách hiển thị mới.
