# ARCHITECTURE.md

## Stack
Client: React + Redux + React Router + Axios + Bootstrap + react-toastify + socket.io-client
Server: Node 16+, Express, Mongoose, JWT, bcryptjs, Socket.IO, multer, express-rate-limit, helmet, express-validator, morgan
DB: MongoDB (single node is enough; design avoids needing transactions)

## Folder structure
```
imovies/
  memory.md task.md architecture.md design.md rules.md prd.md
  server/
    server.js            # http + socket.io bootstrap
    app.js               # express app, middleware, routes
    config/              # db.js, env
    models/              # User Movie Theatre Show Booking Payment Notification
    controllers/         # thin: parse req, call service, send res
    services/            # business logic (seatService, bookingService, paymentService)
    routes/
    middleware/          # auth.js, validate.js, rateLimit.js, error.js
    sockets/             # seat events
    utils/               # logger, ApiError, asyncHandler
    seed/
  client/
    src/ api/ app/(store) features/(redux slices) components/ pages/ routes/ utils/
```

## Data model (collections)
- **User**: name, email(unique), password(hashed, select:false), role(user|admin), phone
- **Movie**: title, description, genres[], languages[], durationMins, rating, releaseDate, posterUrl, isActive. Indexes: text(title,description), (genres,isActive), (languages,isActive), releaseDate. Genre and language indexes are separate because MongoDB cannot build a compound multikey index across both array fields.
- **Theatre**: name, city, address, screens[{name, rows[{row, seatCount, type}]}]. Index: (city,name)
- **Show**: movie, theatre, screenId, language, startTime, endTime, `seats[]`. Indexes: (movie,startTime), (theatre,startTime), unique (theatre,screenId,startTime)
  - seat: label, row, number, type, price, status(available|held|booked), heldBy, heldUntil
- **Booking**: user, show, seats[labels], amount, status(pending|confirmed|cancelled|failed), payment, cancelledAt. Indexes: (user,createdAt), (show,status)
- **Payment**: booking, user, amount, method, status(initiated|processing|success|failed), gatewayRef. `processing` is an internal verification claim to prevent duplicate finalization.
- **Notification**: user, type, message, read

Deviation from spec: no separate `Seats` collection. See memory.md decisions.

## Seat concurrency (core design)
All seat transitions are ONE `updateOne` on a single `Show` document, so they are atomic.
- **Hold**: filter requires every requested label to exist AND none to be `booked` or (`held` with `heldUntil > now`); sets `held`, `heldBy`, `heldUntil = now + SEAT_HOLD_MINS`. `modifiedCount === 0` → conflict (409).
- **Release**: set `available` where `heldBy = user` and label in list.
- **Confirm**: filter requires all labels `held` by this user with `heldUntil > now`; set `booked`.
- **Cancel**: set `booked → available` for the booking's labels; only if `show.startTime > now + CANCEL_CUTOFF_MINS`.
- Expired holds are never cleaned by a job; they are simply treated as free by the hold filter. The seat map API returns expired holds as `available`.

## Booking flow
1. GET `/api/shows/:id` → seat map
2. POST `/api/shows/:id/hold` {seats[]} → hold (5 min) → broadcast
3. POST `/api/payments/initiate` {showId, seats[]} → verify user-owned active holds, recompute total from `Show.seats`, then create Payment(initiated) and Booking(pending)
4. POST `/api/payments/verify` {paymentId, result} → success: confirm seats, Booking=confirmed; failure: release seats, Booking=failed
5. Successful verification creates a Notification; seat transitions broadcast `seats:updated`

## API (all under /api, JSON)
| Area | Routes |
|---|---|
| Auth | POST /auth/register, POST /auth/login, GET /auth/me |
| Movies | GET /movies (q, genre, language, city, date, page, limit), GET /movies/:id, POST/PUT/DELETE (admin) |
| Theatres | GET /theatres, POST/PUT/DELETE (admin) |
| Shows | GET /shows (movie, city, date), GET /shows/:id, POST/PUT/DELETE (admin) |
| Seats | POST /shows/:id/hold, DELETE /shows/:id/hold |
| Payments | POST /payments/initiate, POST /payments/verify |
| Bookings | GET /bookings/me (status, page), GET /bookings/:id, POST /bookings/:id/cancel |
| Notifications | GET /notifications, PATCH /notifications/:id/read |

Response shape: `{ success, data }` or `{ success:false, message, errors? }`.

## Real-time (Socket.IO)
- Client emits `show:join` {showId}, `show:leave` {showId}; server uses room `show:<id>`
- Server emits `seats:updated` {showId, seats:[{label,status}]} after every hold/release/confirm/cancel
- Socket auth: JWT in handshake `auth.token`
- Source of truth is always the DB; socket is a hint. Client re-fetches seat map on reconnect.

## Security
- bcrypt cost 12; JWT in `Authorization: Bearer`; expiry 1d
- `protect` (verify JWT, load user) and `authorize('admin')` middleware
- helmet, cors restricted to `CLIENT_URL`, express-rate-limit (global 100/15min; auth 10/15min)
- Validate every body/query/param; never trust client prices or amounts — recompute from `Show.seats`
- Central error handler; no stack traces in production responses

## Environment variables
MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, PORT, CLIENT_URL, SEAT_HOLD_MINS=5, CANCEL_CUTOFF_MINS=120, SEAT_PRICE_REGULAR=100, SEAT_PRICE_PREMIUM=150, NODE_ENV. Show seat prices are configured on the server and never accepted from Show creation requests.
