const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

let mongoServer;
let server;
let baseUrl;
let owner;
let otherUser;
let ownerToken;
let otherToken;

async function request(path, { method = 'GET', token = ownerToken, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
}

async function createShow(userId, startMinutesAhead = 360) {
  const startTime = new Date(Date.now() + startMinutesAhead * 60_000);
  return Show.create({
    movie: new mongoose.Types.ObjectId(),
    theatre: new mongoose.Types.ObjectId(),
    screenId: new mongoose.Types.ObjectId(),
    language: 'English',
    startTime,
    endTime: new Date(startTime.getTime() + 2 * 60 * 60_000),
    seats: [
      {
        label: 'A1', row: 'A', number: 1, type: 'regular', price: 120,
        status: 'held', heldBy: userId, heldUntil: new Date(Date.now() + 5 * 60_000),
      },
      {
        label: 'A2', row: 'A', number: 2, type: 'premium', price: 220,
        status: 'held', heldBy: userId, heldUntil: new Date(Date.now() + 5 * 60_000),
      },
    ],
  });
}

async function initiate(show, seats = ['A1']) {
  return request('/api/payments/initiate', {
    method: 'POST',
    body: { showId: show._id.toString(), seats, amount: 0 },
  });
}

async function completePayment(show, seats, result = 'success') {
  const start = await initiate(show, seats);
  if (start.status !== 201) return start;
  const finish = await request('/api/payments/verify', {
    method: 'POST',
    body: { paymentId: start.body.data.payment._id, result },
  });
  return { start, finish };
}

beforeAll(async () => {
  process.env.JWT_SECRET = 'booking-payment-test-secret-long-enough';
  process.env.CANCEL_CUTOFF_MINS = '120';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await Promise.all([User.init(), Show.init(), Booking.init(), Payment.init(), Notification.init()]);
  owner = await User.create({ name: 'Booking Owner', email: 'booking-owner@example.com', password: 'ownerPass123' });
  otherUser = await User.create({ name: 'Other User', email: 'other-booking@example.com', password: 'otherPass123' });
  ownerToken = jwt.sign({ id: owner._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
  otherToken = jwt.sign({ id: otherUser._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([Show.deleteMany({}), Booking.deleteMany({}), Payment.deleteMany({}), Notification.deleteMany({})]);
});

test('success recomputes amount, confirms seats, and creates a notification', async () => {
  const show = await createShow(owner._id);
  const { start, finish } = await completePayment(show, ['A1', 'A2']);
  expect(start.status).toBe(201);
  expect(start.body.data.booking.amount).toBe(340);
  expect(start.body.data.payment.amount).toBe(340);
  expect(finish.status).toBe(200);
  expect(finish.body.data.payment.status).toBe('success');
  expect(finish.body.data.booking.status).toBe('confirmed');
  expect(await Notification.countDocuments({ user: owner._id, type: 'booking_confirmed' })).toBe(1);
  const savedShow = await Show.findById(show._id).lean();
  expect(savedShow.seats.map(({ status }) => status)).toEqual(['booked', 'booked']);

  const myBookings = await request('/api/bookings/me?status=confirmed&page=1&limit=1');
  expect(myBookings.status).toBe(200);
  expect(myBookings.body.data.pagination).toMatchObject({ page: 1, limit: 1, total: 1 });
});

test('failure releases held seats and marks the payment and booking failed', async () => {
  const show = await createShow(owner._id);
  const { start, finish } = await completePayment(show, ['A1'], 'failure');
  expect(start.status).toBe(201);
  expect(finish.body.data.payment.status).toBe('failed');
  expect(finish.body.data.booking.status).toBe('failed');
  const savedShow = await Show.findById(show._id).lean();
  expect(savedShow.seats[0].status).toBe('available');
});

test('cancellation is blocked inside the cutoff and succeeds outside it', async () => {
  const insideShow = await createShow(owner._id, 60);
  const inside = await completePayment(insideShow, ['A1']);
  const blocked = await request(`/api/bookings/${inside.finish.body.data.booking._id}/cancel`, { method: 'POST', body: {} });
  expect(blocked.status).toBe(409);

  const outsideShow = await createShow(owner._id, 360);
  const outside = await completePayment(outsideShow, ['A1']);
  const cancelled = await request(`/api/bookings/${outside.finish.body.data.booking._id}/cancel`, { method: 'POST', body: {} });
  expect(cancelled.status).toBe(200);
  expect(cancelled.body.data.status).toBe('cancelled');
  const savedShow = await Show.findById(outsideShow._id).lean();
  expect(savedShow.seats[0].status).toBe('available');
});

test('another user cannot cancel the booking', async () => {
  const show = await createShow(owner._id, 360);
  const result = await completePayment(show, ['A1']);
  const bookingId = result.finish.body.data.booking._id;
  const attempt = await request(`/api/bookings/${bookingId}/cancel`, { method: 'POST', token: otherToken, body: {} });
  expect(attempt.status).toBe(404);
  expect((await Booking.findById(bookingId).lean()).status).toBe('confirmed');
});
