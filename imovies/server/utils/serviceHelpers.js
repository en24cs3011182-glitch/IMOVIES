const ApiError = require('../utils/ApiError');

function pagination(query = {}) {
  const page = Number.parseInt(query.page, 10) || 1;
  const requestedLimit = Number.parseInt(query.limit, 10) || 20;
  return { page, limit: Math.min(requestedLimit, 50), skip: (page - 1) * Math.min(requestedLimit, 50) };
}

function requireId(id, label = 'Resource') {
  const mongoose = require('mongoose');
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, `Invalid ${label.toLowerCase()} id`);
}

function notFound(message) {
  throw new ApiError(404, message);
}

module.exports = { pagination, requireId, notFound };
