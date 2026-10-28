const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const authRoutes = require('../routes/auth');
const { protect, authorize } = require('../middleware/auth');

let mongoServer;
let apiServer;
let adminServer;
let apiBase;
let adminBase;

async function postJson(base, path, body) {
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { response, body: await response.json() };
}

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-only-secret-which-is-long-enough';
  process.env.JWT_EXPIRES_IN = '1h';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  apiServer = app.listen(0);
  apiBase = `http://127.0.0.1:${apiServer.address().port}`;

  const adminApp = express();
  adminApp.get('/api/admin/probe', protect, authorize('admin'), (req, res) => {
    res.json({ success: true });
  });
  adminServer = adminApp.listen(0);
  adminBase = `http://127.0.0.1:${adminServer.address().port}`;
});

afterAll(async () => {
  await Promise.all([
    new Promise((resolve) => apiServer.close(resolve)),
    new Promise((resolve) => adminServer.close(resolve)),
  ]);
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

test('register, login, /me, unauthorized /me, and user access to admin route', async () => {
  const credentials = {
    name: 'Movie User',
    email: 'movie.user@example.com',
    password: 'cinemaPass123',
    role: 'admin',
  };

  const registration = await postJson(apiBase, '/api/auth/register', credentials);
  expect(registration.response.status).toBe(201);
  expect(registration.body.success).toBe(true);
  expect(registration.body.data.user.role).toBe('user');
  expect(registration.body.data.user).not.toHaveProperty('password');

  const login = await postJson(apiBase, '/api/auth/login', {
    email: credentials.email,
    password: credentials.password,
  });
  expect(login.response.status).toBe(200);
  expect(login.body.data.user).not.toHaveProperty('password');
  const token = login.body.data.token;

  const me = await fetch(`${apiBase}/api/auth/me`, {
    headers: { authorization: `Bearer ${token}` },
  });
  expect(me.status).toBe(200);
  const meBody = await me.json();
  expect(meBody.data.user.email).toBe(credentials.email);
  expect(meBody.data.user).not.toHaveProperty('password');

  const anonymousMe = await fetch(`${apiBase}/api/auth/me`);
  expect(anonymousMe.status).toBe(401);

  const adminResponse = await fetch(`${adminBase}/api/admin/probe`, {
    headers: { authorization: `Bearer ${token}` },
  });
  expect(adminResponse.status).toBe(403);
});
