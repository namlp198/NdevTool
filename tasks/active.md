# Active Tasks

## Task #111: Thêm phần Cài đặt Phông chữ, Kích thước Font & Phong cách Hiển thị (Typography & Display Styles)

- **Trạng thái:** Completed
- **Khởi động:** 2026-11-20
- **Mục tiêu:** Cung cấp khả năng tùy chỉnh linh hoạt font chữ lập trình (JetBrains Mono, Fira Code, Cascadia Code, Consolas...), kích thước font chữ (11px -> 16px), khoảng cách dòng, độ đậm và các phong cách hiển thị chữ (Standard, Matrix Green Glow, Cyber Neon, Hacker Crisp, Vintage Amber CRT) kèm khung xem trước trực tiếp (Live Preview).

### Tiêu chí nghiệm thu (Acceptance Criteria):
- [x] Mở rộng `AppSettings` và `src/types.ts` với interface `TypographyConfig`.
- [x] Xây dựng `src/utils/typography.ts` và cơ chế CSS Variables toàn cục (`applyTypographySettings`).
- [x] Tích hợp Google Fonts cho các font lập trình phổ biến (`JetBrains Mono`, `Fira Code`, `Roboto Mono`, `Source Code Pro`).
- [x] Cập nhật `src/index.css` hỗ trợ CSS variables cho font-family, font-size, line-height, font-weight, text-shadow, letter-spacing.
- [x] Bổ sung giao diện cài đặt Typography trong Settings Modal kèm khung **Live Typography Preview Box** trực quan.
- [x] Bản dịch i18n đầy đủ cho tiếng Việt và tiếng Anh trong `src/utils/i18n.ts`.
- [x] Quyết định kiến trúc `decisions/0008_custom_typography_font_size_and_display_styles.md` và cập nhật `decisions/0000_INDEX.md`.
- [x] Báo cáo tại `outputs/claude_drafts/20261120_typography_settings.md`.
- [x] Biên dịch Vite & Electron thành công 0 lỗi, đồng bộ sang `resources/app` và `release/`.
