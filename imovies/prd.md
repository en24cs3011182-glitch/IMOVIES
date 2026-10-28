# PRD.md — Product Requirements

## Summary
IMovies is a full-stack cinema booking platform. Users browse movies, choose a show, pick seats with live availability, pay, and manage bookings. Admins manage movies, theatres, and shows.

## Goals
- Zero double bookings under concurrent use
- Booking completed in under 2 minutes, at most 5 screens
- Production-style codebase: role-based security, validation, logging, indexing, pagination

## Non-goals (v1)
Real payment gateway (mock only), food/beverage ordering, coupons, multi-language UI, mobile app, email/SMS delivery (in-app notifications only), refunds processing (cancellation marks refund status only).

## Users
- **Guest**: browse movies, view shows
- **User**: everything a guest can + hold seats, pay, view/cancel own bookings, notifications
- **Admin**: everything + CRUD movies, theatres, screens, shows; view all bookings

## Functional requirements
| ID | Requirement | Priority |
|---|---|---|
| F1 | Register/login with email+password; JWT auth; roles user/admin | Must |
| F2 | Browse and search movies by title; filter by genre, language, theatre, city, date; paginated | Must |
| F3 | Movie detail page with shows grouped by theatre and date | Must |
| F4 | Seat map with live status for a show (available/held/booked) | Must |
| F5 | Hold up to 6 seats for 5 minutes; auto-expire; release on leave | Must |
| F6 | Payment (mock) with success/failure handling; failure releases seats | Must |
| F7 | Booking confirmation with booking id and seat list | Must |
| F8 | Booking history: upcoming and past | Must |
| F9 | Cancel booking up to 2 hours before showtime; seats return to available | Must |
| F10 | Admin CRUD for movies, theatres/screens, shows (seats generated from screen layout) | Must |
| F11 | In-app notifications for booking confirmed/cancelled | Should |
| F12 | Poster upload via multer | Should |
| F13 | Admin view of all bookings with filters | Could |

## Non-functional requirements
- **Correctness**: seat transitions atomic; server recomputes price
- **Security**: bcrypt, JWT, route protection, rate limiting (auth stricter), helmet, validated input
- **Performance**: indexed queries for search, show filter, booking history, seat lookup; list endpoints paginated; seat map response < 300 ms for a 300-seat show on local DB
- **Reliability**: central error handling, structured logs
- **Responsive**: usable from 360px width
- **Maintainability**: controllers/services/models separation; docs kept in sync

## Acceptance criteria (key)
- Two users hold the same seat simultaneously → exactly one succeeds, other gets 409 and a toast
- A hold older than 5 minutes does not block another user
- Payment failure leaves seats `available` and booking `failed`
- Cancelling inside the 2-hour cutoff is rejected with a clear message
- A user cannot read or cancel another user's booking
- A non-admin calling any admin route gets 403
- Seat map updates on a second browser within ~1 second of a hold

## Open questions
- Which payment gateway (if any) for the final demo? (Default: mock)
- Pricing model: per-seat-type price set per show (current design) vs per theatre?
- Is cancellation refund tracking needed or just status change? (Default: status only)
