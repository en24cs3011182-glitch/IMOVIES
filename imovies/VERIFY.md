# VERIFY.md — Independent checks (do not edit to make things pass)

Use Postman/Thunder Client (or `curl.exe` on Windows). Base URL `http://localhost:5000/api` (use your PORT). Replace `<…>` values. A prompt is done only if EVERY line passes.

## P1 Bootstrap
| Do | Expect |
|---|---|
| `cd server && npm run dev` | console shows MongoDB connected, no errors |
| GET /health | 200 `{success:true}` |
| GET /nope | 404 JSON with `success:false` (not HTML) |
| Hit /health 150 times quickly | later requests return 429 |

## P2 Models
| Do | Expect |
|---|---|
| Open MongoDB Compass, db used by the app | collections can be created; `payments`, `notifications` exist after the helper script runs |
| Helper script output | seat count equals sum of `seatCount` of the screen rows you used |
| In Compass, a Show doc | `seats[0]` has label, price, status `available` |

## P3 Seat service (the important one)
```
cd server
node tests/seat.check.js
```
Expect: every line `PASS` and `ALL PASSED`. Any FAIL = prompt not done. Also run `grep -n "save()" server/services/seatService.js` (or search in the editor): there must be NO matches.

## P4 Auth
| Do | Expect |
|---|---|
| POST /auth/register {name,email,password(8+)} | 201, token returned, NO password field |
| Same email again | 400/409 |
| Password `123` | 400 with validation message |
| POST /auth/login wrong password | 401 |
| POST /auth/login correct | 200 + token |
| GET /auth/me with token / without token | 200 / 401 |
| In Compass, users.password | starts with `$2` (bcrypt) |
| Send 12 bad logins fast | 429 |

## P5 Catalog
| Do | Expect |
|---|---|
| Admin: create theatre, movie, show | 201 each (make admin by setting `role:"admin"` in Compass) |
| Same calls with a normal user token | 403 |
| Create two shows same theatre, screen, startTime | second fails |
| GET /movies?genre=Action | only Action movies |
| GET /movies?page=2&limit=5 | page 2 with 5 or fewer items |
| GET /shows/:id | seats array present with status per seat |
| Set a seat to held with past `heldUntil` in Compass, GET again | that seat shows `available` |

## P6 Hold + sockets
| Do | Expect |
|---|---|
| POST /shows/:id/hold {seats:["A1","A2"]} as user1 | 200 |
| Same seat as user2 | 409 |
| 7 seats at once | 400 |
| DELETE /shows/:id/hold as user1 | 200; seats available again |
| Two tabs/Postman socket clients joined to the show | other client receives `seats:updated` within ~1s |
| Socket connect with no/invalid token | rejected |

## P7 Payments + bookings
| Do | Expect |
|---|---|
| Hold, initiate, verify success | booking `confirmed`, seats `booked`, notification created |
| Hold, initiate, verify failure | booking `failed`, seats `available` |
| Send a fake `amount` in initiate | ignored; amount equals sum of seat prices |
| GET /bookings/me | only your bookings, paginated |
| User2 GET/cancel user1's booking | 403 or 404 |
| Cancel a booking for a show starting in 30 min | rejected |
| Cancel a booking for a show 5+ hours away | 200; seats `available` |

## P8–P10 Frontend (manual, browser)
- Guest can see movies; /my-bookings redirects to login
- Filters and pagination change the list
- Two browsers, same show: a seat held in A turns unavailable in B within ~1s
- Countdown reaches 0: toast shown, seats released
- Failed payment returns to seat map with a toast
- Cancel works; a normal user opening /admin is redirected
- Phone width 360px: no horizontal page scroll (the seat map may scroll)

## Final gate
`node tests/seat.check.js` still passes after every later prompt.
