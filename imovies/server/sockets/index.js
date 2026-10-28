const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const User = require('../models/User');
const Show = require('../models/Show');
const { corsOrigin, isAllowedOrigin } = require('../utils/clientOrigins');

let ioInstance;

function initializeSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
    },
    allowRequest: (request, callback) => {
      const allowed = isAllowedOrigin(request.headers.origin);
      callback(allowed ? null : 'Origin not allowed by CORS', allowed);
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token || !process.env.JWT_SECRET) throw new Error('Unauthorized');
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id);
      if (!user) throw new Error('Unauthorized');
      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('show:join', async (payload = {}, acknowledge) => {
      try {
        const showId = payload && payload.showId;
        if (!mongoose.isValidObjectId(showId) || !(await Show.exists({ _id: showId }))) {
          if (typeof acknowledge === 'function') acknowledge({ success: false, message: 'Show not found' });
          return;
        }
        await socket.join(`show:${showId}`);
        if (typeof acknowledge === 'function') acknowledge({ success: true });
      } catch (error) {
        if (typeof acknowledge === 'function') acknowledge({ success: false, message: 'Show not found' });
      }
    });

    socket.on('show:leave', (payload = {}, acknowledge) => {
      const showId = payload && payload.showId;
      if (!mongoose.isValidObjectId(showId)) {
        if (typeof acknowledge === 'function') acknowledge({ success: false, message: 'Invalid show id' });
        return;
      }
      socket.leave(`show:${showId}`);
      if (typeof acknowledge === 'function') acknowledge({ success: true });
    });
  });

  ioInstance = io;
  return io;
}

async function emitSeatsUpdated(showId, labels) {
  if (!ioInstance) return;
  try {
    const show = await Show.findById(showId).select('seats').lean();
    if (!show) return;
    const labelSet = new Set(labels);
    const seats = show.seats
      .filter(({ label }) => labelSet.has(label))
      .map(({ label, status }) => ({ label, status }));
    if (seats.length) {
      ioInstance.to(`show:${showId}`).emit('seats:updated', { showId: showId.toString(), seats });
    }
  } catch (error) {
    // Seat changes are already committed; a broadcast failure must not reverse them.
  }
}

function closeSockets() {
  if (!ioInstance) return Promise.resolve();
  const current = ioInstance;
  ioInstance = null;
  return new Promise((resolve) => current.close(resolve));
}

module.exports = { initializeSockets, emitSeatsUpdated, closeSockets };
