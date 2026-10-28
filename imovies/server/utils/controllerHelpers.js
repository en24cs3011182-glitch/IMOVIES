const ApiError = require('../utils/ApiError');

function pick(source, fields) {
  return Object.fromEntries(fields.filter((field) => source[field] !== undefined).map((field) => [field, source[field]]));
}

function catchDuplicate(error) {
  if (error.code === 11000) return new ApiError(409, 'A record with these details already exists');
  return error;
}

module.exports = { pick, catchDuplicate };
