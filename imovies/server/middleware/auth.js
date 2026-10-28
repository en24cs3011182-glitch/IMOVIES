const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

function getTokenSecret() {
  if (!process.env.JWT_SECRET) {
    throw new ApiError(500, 'Authentication is not configured');
  }
  return process.env.JWT_SECRET;
}

const protect = asyncHandler(async (req, res, next) => {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new ApiError(401, 'Authentication required');

  let payload;
  try {
    payload = jwt.verify(match[1], getTokenSecret());
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Invalid or expired token');
  }

  const user = await User.findById(payload.id);
  if (!user) throw new ApiError(401, 'Invalid or expired token');
  req.user = user;
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Forbidden'));
  }
  return next();
};

module.exports = { protect, authorize, getTokenSecret };
