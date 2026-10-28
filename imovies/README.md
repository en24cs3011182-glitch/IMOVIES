# IMovies

IMovies is a MERN cinema ticket booking app. Guests browse films and showtimes; signed-in users select seats, make a mock payment, and manage bookings. Admins manage movies, theatres, screens, and shows.

## Features

- Movie search and filters for genre, language, city, and date, with server-side pagination.
- Movie details with theatre showtimes grouped by date.
- Seat selection with atomic holds, expiry countdown, and live Socket.IO updates.
- Mock payment, booking confirmation, booking history, and cancellation with a showtime cutoff.
- Admin screens for movie, theatre, and show management.
- JWT authentication, role checks, request validation, rate limiting, and API security headers.

## Stack

- Client: React, Redux Toolkit, React Router, Axios, Bootstrap, React Toastify, Socket.IO client, Vite.
- Server: Node.js, Express, Mongoose, MongoDB, JWT, bcryptjs, Socket.IO.

## Prerequisites

- Node.js 20.19+ (or 22.12+) and npm. The Vite version in this project requires this Node.js range.
- MongoDB running locally or a MongoDB connection string.
- Git.

## Setup

Clone the repository, replacing the placeholder with its Git URL:

```sh
git clone <repository-url> imovies
cd imovies
```

Install dependencies in each app:

```sh
cd server
npm install
cd ../client
npm install
cd ..
```

Create the server environment file from the root example. In PowerShell:

```powershell
Copy-Item .env.example server/.env
```

On macOS or Linux:

```sh
cp .env.example server/.env
```

Edit `server/.env` before starting the app. In particular, set `MONGO_URI`, replace `JWT_SECRET` with a long random value, and set `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME`, and `SEED_ADMIN_PASSWORD` to the local admin account you want the seed command to create. Keep the localhost origin in `CLIENT_URL`; to use Wi-Fi devices, replace its second sample origin with the Network URL Vite prints, then restart the API.

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string for your local or hosted database; replace the placeholder. |
| `JWT_SECRET` | Secret used to sign and verify login tokens; replace the sample placeholder. |
| `JWT_EXPIRES_IN` | Token lifetime accepted by jsonwebtoken, such as `1d`. |
| `PORT` | API port; default development port is `5000`. |
| `CLIENT_URL` | Comma-separated browser-origin allow-list for the API and Socket.IO. Include localhost and the Network URL Vite prints, replacing the sample IP with this PC's address. |
| `SEAT_HOLD_MINS` | How long a seat hold remains valid; default is 5 minutes. |
| `CANCEL_CUTOFF_MINS` | Minimum time before show start when cancellation is allowed; default is 120 minutes. |
| `SEAT_PRICE_REGULAR` | Server-side price assigned to generated regular seats. |
| `SEAT_PRICE_PREMIUM` | Server-side price assigned to generated premium seats. |
| `NODE_ENV` | Runtime mode; use `production` for deployment so error responses omit stack traces. |
| `SEED_ADMIN_EMAIL` | Email for the admin account created by seeding. |
| `SEED_ADMIN_NAME` | Display name for that admin account. |
| `SEED_ADMIN_PASSWORD` | Password for that admin account; replace the placeholder before seeding. |

`client/.env.example` contains optional price-preview values and `VITE_API_URL`. Leave the API override blank to use the hostname in the address bar, or set it to the server's reachable host. If setting client price previews, keep them aligned with the server settings; the server remains authoritative for seat prices.

## Seed data

With MongoDB running and `server/.env` configured, run:

```sh
cd server
node seed/seed.js
```

The seed creates or updates the admin user, four movies, one theatre, and two shows. The seed command does not print the password; use the value configured in `SEED_ADMIN_PASSWORD` to sign in.

## Run in development

Start the API in one terminal:

```sh
cd server
npm run dev
```

The API listens on `http://localhost:5000` by default.

Start the client in a second terminal:

```sh
cd client
npm run dev
```

Vite listens on `http://localhost:5175` and uses `strictPort`, matching `CLIENT_URL` in the sample environment.

## Tests

Run the independent seat concurrency check from `server/` (requires the configured MongoDB connection; it creates and drops a throwaway database):

```sh
cd server
node tests/seat.check.js
```

The broader automated suite can also be run from `server/` with `npm test`.

## API summary

All API paths are under `/api` and use JSON. Protected endpoints require `Authorization: Bearer <token>`; admin writes require the `admin` role.

| Area | Endpoints | Access |
|---|---|---|
| Health | `GET /health` | Public |
| Authentication | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | Public; `/me` protected |
| Movies | `GET /movies` (search, filters, `page`, `limit` up to 50), `GET /movies/:id`, `POST /movies`, `PUT /movies/:id`, `DELETE /movies/:id` | Reads public; writes admin |
| Theatres | `GET /theatres` (city, `page`, `limit` up to 50), `GET /theatres/:id`, `POST /theatres`, `PUT /theatres/:id`, `DELETE /theatres/:id` | Reads public; writes admin |
| Shows | `GET /shows` (movie, city, date, `page`, `limit` up to 50), `GET /shows/:id`, `POST /shows`, `PUT /shows/:id`, `DELETE /shows/:id` | Reads public; writes admin |
| Seat holds | `POST /shows/:id/hold`, `DELETE /shows/:id/hold` | Protected |
| Payments | `POST /payments/initiate`, `POST /payments/verify` | Protected; verify is owner-only |
| Bookings | `GET /bookings/me` (status, `page`, `limit` up to 50), `GET /bookings/:id`, `POST /bookings/:id/cancel` | Protected; detail and cancel are owner-only |
| Notifications | No notification routes are currently mounted. | Not available |

List responses are paginated and cap `limit` at 50. Movie, theatre, and show reads are public; the booking list is scoped to the authenticated user.

## Folder structure

```text
imovies/
  .env.example
  .gitignore
  README.md
  server/
    app.js, server.js
    config/       MongoDB connection
    controllers/  HTTP handlers
    middleware/   auth, validation, error handling
    models/       Mongoose schemas and indexes
    routes/       API routers
    seed/         development seed script
    services/     catalog, booking, payment, and seat logic
    sockets/      Socket.IO setup
    tests/        automated and seat concurrency checks
    utils/        shared server helpers
  client/
    src/
      api/        Axios client
      app/        Redux store
      components/ shared UI
      features/   Redux feature slices
      pages/      routed screens
      styles.css  application styles
```
