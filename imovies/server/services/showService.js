const Movie = require('../models/Movie');
const Show = require('../models/Show');
const Theatre = require('../models/Theatre');
const ApiError = require('../utils/ApiError');
const generateSeats = require('../utils/generateSeats');
const { pagination, requireId, notFound } = require('../utils/serviceHelpers');

function getServerPrices() {
  const prices = {
    regular: Number(process.env.SEAT_PRICE_REGULAR || 100),
    premium: Number(process.env.SEAT_PRICE_PREMIUM || 150),
  };
  if (Object.values(prices).some((price) => !Number.isFinite(price) || price < 0)) {
    throw new ApiError(500, 'Seat pricing is not configured correctly');
  }
  return prices;
}

async function getShows(filters = {}) {
  const { page, limit, skip } = pagination(filters);
  const query = {};
  if (filters.movie) {
    requireId(filters.movie, 'Movie');
    query.movie = filters.movie;
  }
  if (filters.date) {
    const start = new Date(`${filters.date.slice(0, 10)}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    query.startTime = { $gte: start, $lt: end };
  }
  if (filters.city) {
    const escaped = filters.city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const theatres = await Theatre.find({ city: new RegExp(`^${escaped}$`, 'i') }).select('_id').lean();
    query.theatre = { $in: theatres.map(({ _id }) => _id) };
  }

  const [items, total] = await Promise.all([
    Show.find(query)
      .populate('movie', 'title genres languages durationMins posterUrl')
      .populate('theatre', 'name city address')
      .sort({ startTime: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Show.countDocuments(query),
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getShowById(id) {
  requireId(id, 'Show');
  const show = await Show.findById(id)
    .populate('movie', 'title genres languages durationMins posterUrl')
    .populate('theatre', 'name city address')
    .lean();
  if (!show) notFound('Show not found');
  const now = new Date();
  show.seats = show.seats.map((seat) => {
    if (seat.status === 'held' && seat.heldUntil && seat.heldUntil <= now) {
      return { ...seat, status: 'available', heldBy: null, heldUntil: null };
    }
    return seat;
  });
  return show;
}

async function createShow(data) {
  requireId(data.movie, 'Movie');
  requireId(data.theatre, 'Theatre');
  requireId(data.screenId, 'Screen');
  const [movie, theatre] = await Promise.all([
    Movie.findOne({ _id: data.movie, isActive: true }).select('_id languages').lean(),
    Theatre.findById(data.theatre),
  ]);
  if (!movie) notFound('Movie not found');
  if (!theatre) notFound('Theatre not found');
  const screen = theatre.screens.id(data.screenId);
  if (!screen) notFound('Screen not found in this theatre');
  if (movie.languages.length && !movie.languages.includes(data.language)) {
    throw new ApiError(400, 'Language is not available for this movie');
  }
  const seats = generateSeats(screen, getServerPrices());
  return Show.create({ ...data, seats });
}

async function updateShow(id, data) {
  requireId(id, 'Show');
  if (data.theatre || data.screenId) {
    throw new ApiError(400, 'Theatre and screen cannot be changed after show creation');
  }
  if (data.movie) {
    requireId(data.movie, 'Movie');
    if (!(await Movie.exists({ _id: data.movie, isActive: true }))) notFound('Movie not found');
  }
  if (data.startTime || data.endTime) {
    const current = await Show.findById(id).select('startTime endTime').lean();
    if (!current) notFound('Show not found');
    const startTime = data.startTime ? new Date(data.startTime) : current.startTime;
    const endTime = data.endTime ? new Date(data.endTime) : current.endTime;
    if (endTime <= startTime) throw new ApiError(400, 'Show end time must be after start time');
  }
  const show = await Show.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('movie', 'title genres languages durationMins posterUrl')
    .populate('theatre', 'name city address')
    .lean();
  if (!show) notFound('Show not found');
  return show;
}

async function deleteShow(id) {
  requireId(id, 'Show');
  const show = await Show.findByIdAndDelete(id).lean();
  if (!show) notFound('Show not found');
  return show;
}

module.exports = { getShows, getShowById, createShow, updateShow, deleteShow };
