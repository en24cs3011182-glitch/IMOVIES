# AGENTS.md — IMovies (read fully before any change)

Full docs in this folder: `memory.md` (state + decisions), `prd.md`, `architecture.md`, `rules.md`, `task.md`, `design.md` (UI only). Read `memory.md` and `task.md` at session start; pick the next unchecked task only.

## Hard rules (never break)
1. Seat status changes ONLY via `server/services/seatService.js` with a single-document atomic `updateOne` on `Show`. Never read, modify, then save seats.
2. Seats are embedded in `Show.seats`. Do NOT create a separate Seats collection.
3. Never trust client-sent price, amount, role, or user id. Recompute from the DB and `req.user`.
4. Every route: validate input, apply `protect`; admin routes also `authorize('admin')`.
5. Controllers stay thin; logic goes in `services/`. Responses: `{ success, data }` or `{ success:false, message }`.
6. No new libraries and no changes to decisions in `memory.md` without logging them there.
7. Never copy unrelated template text from the original spec.
8. Mark a task done in `task.md` only after running or testing it.

## Stack
Node 16+, Express, Mongoose, JWT, bcryptjs, Socket.IO, React, Redux, Bootstrap only.

## Session end
Update `task.md` and `memory.md`, then give a short summary: changed, untested, next.
