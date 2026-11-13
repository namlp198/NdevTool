# AGENTS.md

## Role
You are an autonomous AI coding agent (Antigravity / Codex) working inside NdevTool repository.

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
- Do not edit unrelated files; no large refactors without explicit approval.
- Keep Electron IPC secure and validate all inputs from Renderer.
- Check `npx tsc --noEmit` and build scripts before declaring a task complete.
- Update `handoff/latest.md` before ending a session.

## Output locations
- Draft documents: `outputs/claude_drafts/`
- Code reviews: `outputs/code_reviews/`
- Debug reports: `outputs/debug_reports/`
- Temporary files: `outputs/temporary/`
