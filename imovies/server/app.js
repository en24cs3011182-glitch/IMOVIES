require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
const ApiError = require('./utils/ApiError');
const { corsOrigin } = require('./utils/clientOrigins');
const errorHandler = require('./middleware/error');
const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const theatreRoutes = require('./routes/theatres');
const showRoutes = require('./routes/shows');
const seatRoutes = require('./routes/seats');
const paymentRoutes = require('./routes/payments');
const bookingRoutes = require('./routes/bookings');

const app = express();

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/api/health', (req, res) => {
  res.json({ success: true });
});

app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/shows', seatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bookings', bookingRoutes);

app.use((req, res, next) => next(new ApiError(404, 'Route not found')));
app.use(errorHandler);

module.exports = app;
