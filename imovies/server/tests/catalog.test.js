const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');

let mongoServer;
let server;
let baseUrl;
let adminToken;

async function request(path, { method = 'GET', token = adminToken, body } = {}) {
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

async function createMovie(title, genres, releaseDate) {
  return request('/api/movies', {
    method: 'POST',
    body: {
      title,
      genres,
      languages: ['English'],
      durationMins: 100,
      releaseDate,
    },
  });
}

beforeAll(async () => {
  process.env.JWT_SECRET = 'catalog-test-secret-with-adequate-length';
  process.env.SEAT_PRICE_REGULAR = '77';
  process.env.SEAT_PRICE_PREMIUM = '123';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await Promise.all([User.init(), Movie.init(), Theatre.init(), Show.init()]);

  const admin = await User.create({
    name: 'Catalog Admin',
    email: 'catalog-admin@example.com',
    password: 'catalogAdmin123',
    role: 'admin',
  });
  adminToken = jwt.sign({ id: admin._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([Movie.deleteMany({}), Theatre.deleteMany({}), Show.deleteMany({})]);
});

test('admin creates a theatre, movie and show with server-priced seats; genre filter and page two work', async () => {
  const theatreResult = await request('/api/theatres', {
    method: 'POST',
    body: {
      name: 'Central Cinema',
      city: 'Test City',
      screens: [{
        name: 'Screen 1',
        rows: [
          { row: 'A', seatCount: 2, type: 'regular' },
          { row: 'B', seatCount: 1, type: 'premium' },
        ],
      }],
    },
  });
  expect(theatreResult.status).toBe(201);
  const theatre = theatreResult.body.data;

  const movieResult = await createMovie('Night of Samples', ['Drama'], new Date().toISOString());
  expect(movieResult.status).toBe(201);
  const movie = movieResult.body.data;

  const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const showResult = await request('/api/shows', {
    method: 'POST',
    body: {
      movie: movie._id,
      theatre: theatre._id,
      screenId: theatre.screens[0]._id,
      language: 'English',
      startTime: startTime.toISOString(),
      endTime: new Date(startTime.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    },
  });
  expect(showResult.status).toBe(201);
  const show = showResult.body.data;
  expect(show.seats.map(({ price }) => price)).toEqual([77, 77, 123]);
  expect(show.seats.map(({ status }) => status)).toEqual(['available', 'available', 'available']);

  await Show.updateOne(
    { _id: show._id },
    { $set: { 'seats.0.status': 'held', 'seats.0.heldBy': new mongoose.Types.ObjectId(), 'seats.0.heldUntil': new Date(Date.now() - 1000) } }
  );
  const showMap = await request(`/api/shows/${show._id}`, { token: null });
  expect(showMap.status).toBe(200);
  expect(showMap.body.data.seats[0]).toMatchObject({ status: 'available', heldBy: null, heldUntil: null });
  const storedShow = await Show.findById(show._id).lean();
  expect(storedShow.seats[0].status).toBe('held');

  await createMovie('Drama Page One', ['Drama'], '2026-01-01T00:00:00.000Z');
  await createMovie('Drama Page Three', ['Drama'], '2026-03-01T00:00:00.000Z');
  await createMovie('Comedy Only', ['Comedy'], '2026-02-01T00:00:00.000Z');

  const filtered = await request('/api/movies?genre=drama&limit=1&page=2', { token: null });
  expect(filtered.status).toBe(200);
  expect(filtered.body.data.pagination).toMatchObject({ page: 2, limit: 1, total: 3, pages: 3 });
  expect(filtered.body.data.items).toHaveLength(1);
  expect(filtered.body.data.items[0].genres).toContain('Drama');

  const clamped = await request('/api/movies?genre=drama&limit=100', { token: null });
  expect(clamped.body.data.pagination.limit).toBe(50);
});

test('regular users cannot create catalog records', async () => {
  const user = await User.create({
    name: 'Catalog User',
    email: 'catalog-user@example.com',
    password: 'catalogUser123',
  });
  const userToken = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const result = await request('/api/theatres', {
    method: 'POST',
    token: userToken,
    body: { name: 'Forbidden Cinema', city: 'Test City', screens: [] },
  });
  expect(result.status).toBe(403);
});

