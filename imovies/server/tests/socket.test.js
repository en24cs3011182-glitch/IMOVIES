const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { io: createClient } = require('socket.io-client');
const app = require('../app');
const User = require('../models/User');
const Show = require('../models/Show');
const { initializeSockets, closeSockets } = require('../sockets');
const { confirmSeats, cancelSeats } = require('../services/seatService');

let mongoServer;
let server;
let user;
let token;
let show;
let baseUrl;
let clients = [];

function waitForEvent(socket, eventName) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${eventName}`)), 3000);
    socket.once(eventName, (payload) => {
      clearTimeout(timeout);
      resolve(payload);
    });
  });
}

function connectTab(authToken = token) {
  const socket = createClient(baseUrl, {
    auth: { token: authToken },
    transports: ['websocket'],
    reconnection: false,
  });
  clients.push(socket);
  return new Promise((resolve, reject) => {
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', reject);
  });
}

async function joinShow(socket) {
  return new Promise((resolve, reject) => {
    socket.emit('show:join', { showId: show._id.toString() }, (result) => {
      if (result.success) resolve();
      else reject(new Error(result.message));
    });
  });
}

async function postHold(labels) {
  return fetch(`${baseUrl}/api/shows/${show._id}/hold`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ labels }),
  });
}

beforeAll(async () => {
  process.env.JWT_SECRET = 'socket-test-secret-with-adequate-length';
  process.env.CLIENT_URL = 'http://localhost:5173';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await Promise.all([User.init(), Show.init()]);
  user = await User.create({ name: 'Socket User', email: 'socket@example.com', password: 'socketPass123' });
  token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });

  server = http.createServer(app);
  initializeSockets(server);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  for (const client of clients) client.disconnect();
  await closeSockets();
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Show.deleteMany({});
  show = await Show.create({
    movie: new mongoose.Types.ObjectId(),
    theatre: new mongoose.Types.ObjectId(),
    screenId: new mongoose.Types.ObjectId(),
    language: 'English',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 26 * 60 * 60 * 1000),
    seats: ['A1', 'A2'].map((label, index) => ({
      label,
      row: 'A',
      number: index + 1,
      type: 'regular',
      price: 100,
      status: 'available',
    })),
  });
});

test('two tabs receive seat updates, competing hold conflicts, and each transition broadcasts', async () => {
  const tabOne = await connectTab();
  const tabTwo = await connectTab();
  await Promise.all([joinShow(tabOne), joinShow(tabTwo)]);

  let updatePromise = waitForEvent(tabTwo, 'seats:updated');
  const firstHold = await postHold(['A1']);
  expect(firstHold.status).toBe(200);
  expect(await updatePromise).toMatchObject({
    showId: show._id.toString(),
    seats: [{ label: 'A1', status: 'held' }],
  });

  const competingHold = await postHold(['A1']);
  expect(competingHold.status).toBe(409);

  updatePromise = waitForEvent(tabTwo, 'seats:updated');
  const release = await fetch(`${baseUrl}/api/shows/${show._id}/hold`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ labels: ['A1'] }),
  });
  expect(release.status).toBe(200);
  expect(await updatePromise).toMatchObject({ seats: [{ label: 'A1', status: 'available' }] });

  updatePromise = waitForEvent(tabTwo, 'seats:updated');
  expect((await postHold(['A2'])).status).toBe(200);
  expect(await updatePromise).toMatchObject({ seats: [{ label: 'A2', status: 'held' }] });

  updatePromise = waitForEvent(tabTwo, 'seats:updated');
  await expect(confirmSeats(show._id, ['A2'], user._id)).resolves.toBe(true);
  expect(await updatePromise).toMatchObject({ seats: [{ label: 'A2', status: 'booked' }] });

  updatePromise = waitForEvent(tabTwo, 'seats:updated');
  await expect(cancelSeats(show._id, ['A2'])).resolves.toBe(true);
  expect(await updatePromise).toMatchObject({ seats: [{ label: 'A2', status: 'available' }] });
});

test('Socket.IO rejects a missing or invalid JWT', async () => {
  await expect(connectTab('not-a-valid-jwt')).rejects.toThrow('Unauthorized');
});
