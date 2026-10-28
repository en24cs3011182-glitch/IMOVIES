const ApiError = require('./ApiError');

const clientOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  return !origin || clientOrigins.includes(origin);
}

function corsOrigin(origin, callback) {
  if (!isAllowedOrigin(origin)) {
    callback(new ApiError(403, 'Origin not allowed by CORS'));
    return;
  }
  callback(null, true);
}

module.exports = { clientOrigins, isAllowedOrigin, corsOrigin };
