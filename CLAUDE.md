# CLAUDE.md

## Role
You are Claude Code working as a senior coding assistant inside NdevTool repository.

## Mandatory reading order
Before inspecting or modifying any code in this repository, you MUST read the following files in order:
1. `README.md`
2. `docs/README_AI_WORKFLOW.md`
3. `docs/00_CONTEXT.md`
4. `tasks/active.md`
5. `handoff/latest.md`
6. `decisions/0000_INDEX.md`

## Repository rules
- Do not change architecture without updating `decisions/`.
- Maintain strict TypeScript type checking (`npx tsc --noEmit`).
- When changing IPC signatures, synchronize `electron/main.ts`, `electron/preload.ts`, and `src/types.ts`.
- Update `handoff/latest.md` before ending a session.

## Output locations
- Draft documents: `outputs/claude_drafts/`
- Code reviews: `outputs/code_reviews/`
- Debug reports: `outputs/debug_reports/`
- Temporary files: `outputs/temporary/`
