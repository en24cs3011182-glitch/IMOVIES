# MEMORY.md — Project Context (read FIRST on every AI switch)

Update this file at the end of every work session. Keep it short; move detail to the other docs.

## Project
IMovies — MERN cinema booking system: browse movies, pick showtimes, select seats in real time, pay, manage bookings. Admin panel for movies/theatres/shows.
Owner context: student project (placement portfolio, 2027). Project name in Claude: "Online Ticket Booking".

## Source of truth (read in this order)
1. `prd.md` — what to build
2. `architecture.md` — how it is built
3. `rules.md` — how to behave/code
4. `design.md` — UI spec
5. `task.md` — what is done / next
6. `memory.md` — this file (decisions + state)

## Stack
Node 16+, Express, Mongoose/MongoDB, React, Redux, Bootstrap, Socket.IO, JWT, bcryptjs, multer, dotenv, cors.
Added (not in original spec): express-rate-limit, helmet, express-validator, morgan.

## Decisions log
| Date | Decision | Why |
|---|---|---|
| 2026-10-27 | Seats are EMBEDDED in `Show.seats`, not a separate `Seats` collection (deviates from spec) | Multi-seat hold/book becomes one atomic single-doc update; no transactions/replica set needed |
| 2026-10-27 | Seat holds expire lazily via `heldUntil` (5 min); no cron | An expired hold counts as free in the atomic filter; simpler and race-safe |
| 2026-10-27 | Real-time via Socket.IO (listed in spec deps) | Seat map must update across users |
| 2026-10-27 | Payment = mock gateway first, behind a `paymentService` interface | Real gateway undecided; swap later without touching booking logic |
| 2026-10-27 | UI library = Bootstrap (not Material UI) | Listed in required skills; one library only |
| 2026-10-27 | Jest + mongodb-memory-server for seat concurrency checks | Verify atomic seat updates without a local database |
| 2026-10-27 | Show seat prices come from server environment configuration | Do not accept client-supplied seat prices; regular/premium defaults are configurable |
| 2026-10-27 | Movie genre/language indexes are separate | MongoDB rejects compound multikey indexes across both array fields |
| 2026-10-27 | Socket.IO seat events are emitted by the seat service after successful atomic updates | All hold/release/confirm/cancel paths broadcast current seat state |
| 2026-10-27 | socket.io-client used for realtime integration checks | Exercise show rooms with independent client connections |
| 2026-10-27 | Payment verification uses an internal `processing` claim | Prevent duplicate verification from confirming or releasing the same seats twice |

## Known pitfalls
- The inherited source spec contains unrelated template copy. Do not reproduce it in project files.
- Never read-then-write seat status. Always use the atomic update in `services/seatService.js`.
- `Seat` collection in the spec is intentionally not created.

## Current state (2026-10-27)
Done: catalog and auth APIs; atomic seat operations and Socket.IO events; mock payment initiate/verify; booking confirmation, paginated history, owner-only cancellation, and success notifications.
Verified: `npm test` passes all 13 tests, covering payment success/failure, database-recomputed totals, cancellation cutoff, ownership, catalog pagination, auth, seat concurrency, and realtime broadcasts against mongodb-memory-server. Payment and Notification schemas and indexes plus `generateSeats` also verified by creating a Theatre, generating 5 seats, saving a Show, and printing `5` using mongodb-memory-server.
Client work (2026-10-28): movie details, live seat selection/payment, confirmation, Upcoming/Past bookings, and admin CRUD are implemented. API checks covered socket updates, payment and cancellation flows, seat release, catalog CRUD, and role denial. Responsive table-to-card CSS is in place; a rendered 360px viewport check remains open.
Latest repo/network work (2026-10-28): added root setup docs and ignore/env examples, cleaned template text, aligned API host to the opened hostname, enabled Vite on all interfaces, and shared a comma-separated HTTP/Socket.IO origin allow-list. Set the ignored local `server/.env` to this PC's Wi-Fi IP. Build passed; Vite, API movies, CORS rejection, and live seat updates passed on localhost/LAN with a temporary API on port 5001. The existing port-5000 process was not restarted because its hosted database is unreachable from this shell; no second Wi-Fi device was available. No `seatService`, test, or VERIFY files were changed.
Seat release controls (2026-10-28): added release-all and single-seat release on the seat map, checkout Back / Cancel, and cleanup on leaving checkout while keeping successful payments booked. Client JSX parsing passed; live two-seat release returned both seats to available and emitted hold/release socket events. Existing Vite/API routes returned HTTP 200. A fresh Vite build failed because the linked `client/vite.config.js` could not be resolved due to an access-denied parent directory; browser interaction checks for route-exit cleanup and completed payment remain open.
Next: finish the 360px layout check, then implement notification listing/read endpoints.

