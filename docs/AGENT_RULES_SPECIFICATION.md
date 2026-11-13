# Quy tắc Cấu hình Agent (CLAUDE.md & AGENTS.md Specification)

> **Mã đặc tả:** AWS-SPEC-05  
> **Tài liệu tham chiếu:** `docs/00_AI_WORKSPACE_STANDARD.md`  
> **Tệp đích trên đĩa:** `<repo_root>/CLAUDE.md` và `<repo_root>/AGENTS.md`

---

## 1. Phân biệt giữa `CLAUDE.md` và `AGENTS.md`

- **`CLAUDE.md`:** Là tệp hệ thống mặc định được tự động nạp bởi **Claude Code CLI** của Anthropic khi khởi động trong thư mục làm việc.
- **`AGENTS.md`:** Là quy ước mở được sử dụng bởi **OpenAI Codex**, **Google Antigravity**, hoặc các agentic framework khác.

Để đảm bảo tính nhất quán trên mọi Engine, nội dung cốt lõi của hai tệp này phải đồng bộ về mặt nguyên tắc, thứ tự đọc và các điều cấm kỵ.

---

## 2. Bản mẫu chuẩn (Template) cho `CLAUDE.md`

```markdown
# CLAUDE.md

## Role
You are Claude Code working as a senior coding assistant inside this repository.

## Mandatory reading order
Before inspecting or modifying any source files, you MUST read the following files in order:
1. `README.md`
2. `docs/README_AI_WORKFLOW.md`
3. `docs/00_CONTEXT.md`
4. `tasks/active.md`
5. `handoff/latest.md`
6. `decisions/0000_INDEX.md`

## Repository rules
- Do not modify system architecture without an accepted record in `decisions/`.
- Stay focused strictly on the tasks defined in `tasks/active.md`. Do not perform unsolicited broad refactoring.
- Keep changes minimal, clean, and reviewable.
- All hardware-facing operations must be Read-Only by default unless explicitly confirmed by the operator.
- Before concluding any session, you MUST update `handoff/latest.md` with what was completed, touched files, open risks, and next steps.
- Run build / smoke-check scripts before declaring a task complete.

## Output locations
- Draft documents: `outputs/claude_drafts/`
- Code reviews: `outputs/code_reviews/`
- Debug reports: `outputs/debug_reports/`
- Temporary files: `outputs/temporary/`
```

---

## 3. Bản mẫu chuẩn (Template) cho `AGENTS.md`

```markdown
# AGENTS.md

## Role
You are an autonomous AI coding agent (Antigravity / Codex) working inside this repository.

## Mandatory reading order
1. `README.md`
2. `docs/README_AI_WORKFLOW.md`
3. `docs/00_CONTEXT.md`
4. `tasks/active.md`
5. `handoff/latest.md`
6. `decisions/0000_INDEX.md`

## Safety & Operational Constraints
- Preserve stable existing modules; check `decisions/0000_INDEX.md` before making design choices.
- Output intermediate artifacts only to `outputs/` subdirectories.
- Always maintain and synchronize `handoff/latest.md` upon completing instructions.
```
