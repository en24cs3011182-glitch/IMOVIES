# RULES.md — Mandatory for every AI/human working on this repo

## On every session start
1. Read `memory.md`, then `prd.md`, `architecture.md`, `rules.md`. Read `design.md` only for UI work.
2. Read `task.md`, pick the next unchecked item. Do not start unrelated work.
3. Read only the source files relevant to that task.

## On every session end
1. Tick finished items in `task.md` (only if run/tested). Add newly discovered tasks.
2. Update "Current state" and the decisions table in `memory.md`.
3. If architecture changed, update `architecture.md` in the same change. Docs must never contradict code.
4. Give the user a short summary: what changed, what is untested, next step.

## Non-negotiables
- Seat status changes ONLY through `services/seatService.js` using single-document atomic updates. Never read-modify-save seats.
- Never trust client-sent prices, amounts, roles, or user ids. Derive from DB and `req.user`.
- Passwords hashed, never returned (`select:false`). Never log secrets or tokens.
- Every route validates input and sets the correct auth middleware. Admin routes use `authorize('admin')`.
- No secrets in git. Keep `.env.example` current.
- Do not add a new library or change a recorded decision without logging it in `memory.md`.
- Do not copy unrelated template text from source materials into project files.

## Code standards
- JavaScript (CommonJS on server, ES modules on client). async/await, no callbacks.
- Controllers thin; business logic in `services/`; wrap handlers in `asyncHandler`; throw `ApiError(status, message)`.
- Consistent responses: `{ success, data }` / `{ success:false, message }`.
- Naming: files camelCase (`seatService.js`), models PascalCase, routes plural nouns, env vars UPPER_SNAKE.
- Pagination on every list endpoint (`page`, `limit`, max 50).
- Add an index for every new query pattern; verify with `explain()`.
- Small functions, early returns, no dead code, no unused deps.

## Git
- Branch per feature: `feat/<name>`, `fix/<name>`. Commit often, imperative messages ("Add seat hold service").
- One logical change per commit. Never commit `node_modules` or `.env`.

## Testing
- A feature is done only when run and verified: Postman call or automated test.
- Seat logic requires a concurrency test (parallel holds on the same seat → exactly one success).

## Working style (token efficiency)
- Concise answers; no repeated explanations; show only changed sections unless the full file is needed.
- Group related changes into one task. Correctness beats brevity when they conflict.
- If requirements are unclear or contradictory, ask one precise question rather than guess.
