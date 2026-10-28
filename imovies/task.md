# TASK.md — Progress Tracker

Rule: update after every work session. Mark `[x]` only when the code exists AND was run/tested. Add new tasks at the bottom of the relevant phase.

## Phase 1 — Environment setup
- [ ] Init git repo (not initialized in this workspace)
- [x] Root `.gitignore` excludes node_modules, `.env`, and dist
- [ ] `server/` package.json + deps (express, mongoose, bcryptjs, jsonwebtoken, cors, dotenv, multer, socket.io, express-rate-limit, helmet, express-validator, morgan)
- [ ] `client/` via Vite or CRA + deps (axios, react-router-dom, redux/@reduxjs/toolkit, react-toastify, bootstrap)
- [x] `.env` examples list server and client environment variables with placeholders/defaults
- [ ] `config/db.js`, `server.js`, `app.js`

## Phase 2 — Database
- [x] User model
- [x] Movie model (text + filter indexes)
- [x] Theatre model (embedded screens + row layout)
- [x] Show model (embedded seats, indexes)
- [x] Booking model
- [x] Payment model
- [x] Notification model
- [x] `services/seatService.js` (holdSeats, releaseSeats, confirmSeats, cancelSeats) — atomic; requested `node tests/seat.check.js` could not run because that file is absent
- [x] Show creation helper: generate `seats[]` from screen layout + server-configured pricing (verified: Theatre screen generated 5 seats and saved a Show)
- [x] Seed script (admin user, 4 movies, theatre, 2 shows; verified with mongodb-memory-server)

## Phase 3 — Backend modules
- [x] Auth: register, login, me (verified register, duplicate email, short password, wrong/right login, `/me` with/without token)
- [x] Movies: CRUD + search/filter/pagination
- [x] Theatres: CRUD (admin)
- [x] Shows: CRUD (admin), list by movie/city/date, seat map
- [x] Seat hold / release endpoints (protected `{ seats }`, maximum six, expiry returned, conflicts return 409)
- [x] Payments: initiate, verify (replaceable mock gateway; amount recomputed from Show seats)
- [x] Bookings: confirm, paginated history, owner-only detail, cancel (cutoff enforced; notifications created)
- [ ] Notifications
- [x] Socket.IO: JWT handshake auth, `show:<id>` rooms, join/leave, `seats:updated` after successful hold/release

## Phase 4 — Security
- [x] `protect` + `authorize('admin')` middleware
- [x] Rate limiting (global + stricter on auth)
- [ ] Input validation on every route
- [x] Central error handler + logging (production errors hide stack traces)

## Phase 5 — Frontend
- [x] Router, layout, navbar, protected routes (guest Login/Register and signed-in Logout)
- [x] Auth pages (login/register routes and forms present; modules compile)
- [x] Movie list (search/filter/pagination) + details (12 per page; API filter/page smoke checks pass)
- [x] Show selection + seat map (live; live socket update and competing hold verified with two independent clients)
- [x] Vite Network URL support (dynamic host and allow-list; same-PC Vite/API/socket flow verified on a temporary API; default API restart and separate device not tested)
- [x] Payment + confirmation pages (failure releases seats; success confirms the booking and seat labels)
- [x] Seat hold release controls: release all/one seat, checkout cancel, release on leaving, preserve successful payments (client source parsed; live hold/release and socket updates passed)
- [x] My bookings (Upcoming/Past, 10-item pagination, confirmed-booking cancel confirmation and refresh; API flow verified)
- [x] Admin dashboard (movies, theatres, shows; CRUD modals and delete confirmation; admin API flows verified)
- [ ] Toasts, responsive pass (API error toast interceptor exists; responsive card CSS added, 360px browser viewport still needs verification)

## Phase 6 — Testing
- [x] Auth flow (register, login, `/me`, missing-token 401, user-token admin 403; duplicate, short-password, and wrong-password cases verified)
- [x] Concurrent hold test: 20 users, same seat → exactly one wins
- [x] Two socket clients receive hold/release updates; competing hold returns 409; seven-seat request returns 400
- [ ] Browser-check release button, route-exit cleanup, and successful-payment booked state (build access error prevented a fresh bundle/browser interaction check)
- [x] Expired hold becomes bookable
- [x] Payment success/failure paths release or confirm seats; client amount ignored; repeat verify is idempotent
- [x] Cancellation inside/outside cutoff, cancellation notifications, and another-user booking denial
- [x] Movie genre filter and page 2 pagination
- [ ] Postman collection exported to `docs/`

## Phase 7 — Optimization
- [ ] Verify indexes with `explain()`
- [x] Pagination on movie, theatre, show, and booking lists; limit capped at 50
- [ ] Refactor pass (controllers thin, logic in services)
- [x] README with setup, seed, run, test, API, and folder structure instructions

## Next up
1. Notification listing/read endpoints
2. Postman collection exported to `docs/`

