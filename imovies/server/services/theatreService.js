const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const { pagination, requireId, notFound } = require('../utils/serviceHelpers');
const ApiError = require('../utils/ApiError');

async function getTheatres(filters = {}) {
  const { page, limit, skip } = pagination(filters);
  const query = filters.city
    ? { city: new RegExp(`^${filters.city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    : {};
  const [items, total] = await Promise.all([
    Theatre.find(query).sort({ city: 1, name: 1 }).skip(skip).limit(limit).lean(),
    Theatre.countDocuments(query),
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getTheatreById(id) {
  requireId(id, 'Theatre');
  const theatre = await Theatre.findById(id).lean();
  if (!theatre) notFound('Theatre not found');
  return theatre;
}

async function createTheatre(data) {
  return Theatre.create(data);
}

async function updateTheatre(id, data) {
  requireId(id, 'Theatre');
  const theatre = await Theatre.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  if (!theatre) notFound('Theatre not found');
  return theatre;
}

async function deleteTheatre(id) {
  requireId(id, 'Theatre');
  if (await Show.exists({ theatre: id })) throw new ApiError(409, 'Theatre has shows and cannot be deleted');
  const theatre = await Theatre.findByIdAndDelete(id).lean();
  if (!theatre) notFound('Theatre not found');
  return theatre;
}

module.exports = { getTheatres, getTheatreById, createTheatre, updateTheatre, deleteTheatre };
