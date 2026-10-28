const Movie = require('../models/Movie');
const Show = require('../models/Show');
const Theatre = require('../models/Theatre');
const { pagination, requireId, notFound } = require('../utils/serviceHelpers');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function getMovies(filters = {}) {
  const { page, limit, skip } = pagination(filters);
  const query = { isActive: true };
  if (filters.q) query.$text = { $search: filters.q.trim() };
  if (filters.genre) query.genres = new RegExp(`^${escapeRegex(filters.genre.trim())}$`, 'i');
  if (filters.language) query.languages = new RegExp(`^${escapeRegex(filters.language.trim())}$`, 'i');

  if (filters.city || filters.date) {
    const showQuery = {};
    if (filters.date) {
      const start = new Date(`${filters.date.slice(0, 10)}T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      showQuery.startTime = { $gte: start, $lt: end };
    }
    if (filters.city) {
      const theatres = await Theatre.find({ city: new RegExp(`^${escapeRegex(filters.city.trim())}$`, 'i') })
        .select('_id')
        .lean();
      showQuery.theatre = { $in: theatres.map(({ _id }) => _id) };
    }
    const movieIds = await Show.distinct('movie', showQuery);
    query._id = { $in: movieIds };
  }

  const [items, total] = await Promise.all([
    Movie.find(query).sort({ releaseDate: -1, _id: 1 }).skip(skip).limit(limit).lean(),
    Movie.countDocuments(query),
  ]);
  return {
    items,
    page,
    limit,
    total,
    // HomePage consumes pagination.pages; keep this view alongside the flat API fields.
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

async function getMovieById(id) {
  requireId(id, 'Movie');
  const movie = await Movie.findOne({ _id: id, isActive: true }).lean();
  if (!movie) notFound('Movie not found');
  return movie;
}

async function createMovie(data) {
  return Movie.create(data);
}

async function updateMovie(id, data) {
  requireId(id, 'Movie');
  const movie = await Movie.findOneAndUpdate({ _id: id, isActive: true }, data, {
    new: true,
    runValidators: true,
    context: 'query',
  }).lean();
  if (!movie) notFound('Movie not found');
  return movie;
}

async function deleteMovie(id) {
  requireId(id, 'Movie');
  const movie = await Movie.findOneAndUpdate({ _id: id, isActive: true }, { $set: { isActive: false } }, {
    new: true,
    runValidators: true,
  }).lean();
  if (!movie) notFound('Movie not found');
  return movie;
}

module.exports = { getMovies, getMovieById, createMovie, updateMovie, deleteMovie };
