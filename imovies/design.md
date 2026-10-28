# DESIGN.md — UI/UX Spec

Library: Bootstrap 5 only (do not mix in Material UI). State: Redux Toolkit. Toasts: react-toastify.

## Pages and routes
| Route | Page | Access |
|---|---|---|
| / | Home: now showing grid, search bar, filters | public |
| /movies/:id | Movie details + show list (grouped by theatre, date tabs) | public |
| /shows/:id | Seat selection | user |
| /checkout/:holdId or state | Payment | user |
| /booking/:id/confirmation | Confirmation / ticket | user |
| /my-bookings | Upcoming and past tabs, cancel button | user |
| /login, /register | Auth | guest |
| /admin | Dashboard summary | admin |
| /admin/movies, /admin/theatres, /admin/shows | Tables + create/edit modals | admin |

## Components
Navbar, Footer, ProtectedRoute, AdminRoute, MovieCard, MovieFilters, Pagination, ShowTimeList, SeatMap, SeatLegend, BookingSummary, HoldCountdown, PaymentForm, BookingCard, DataTable, ConfirmModal, Loader, EmptyState.

## Seat map
- Rows labelled A, B, C…; seats as buttons in a grid; screen indicator bar at top
- States and colours: available (light/outline), selected (primary), held by others (warning, disabled), booked (secondary/grey, disabled), premium (accent border)
- Max 6 seats per booking (enforced client AND server)
- After hold: show `HoldCountdown` (5:00). At 0:00 release, toast "Hold expired", return to seat map
- Live updates via Socket.IO; on reconnect refetch
- Colour is never the only signal: disabled seats also get an icon or aria-label ("A4 booked")

## UX rules
- Every async action: loading state + success/error toast
- Forms: inline validation messages, disable submit while pending
- Lists: server-side pagination (default 12 movies, 10 bookings)
- Mobile first: seat map horizontally scrollable under 576px; tables collapse to cards
- Accessibility: labels on inputs, keyboard-focusable seats, contrast AA
- Empty states for no movies, no shows, no bookings

## Redux slices
auth (user, token), movies (list, filters, page), shows (current show, seats), booking (selectedSeats, hold, countdown), bookings (history), ui (loading flags). Token in localStorage; axios interceptor attaches it and handles 401 → logout.
