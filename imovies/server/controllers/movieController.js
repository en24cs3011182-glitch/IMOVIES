const movieService = require('../services/movieService');
const asyncHandler = require('../utils/asyncHandler');
const { pick, catchDuplicate } = require('../utils/controllerHelpers');
const fields = ['title', 'description', 'genres', 'languages', 'durationMins', 'rating', 'releaseDate', 'posterUrl', 'trailerUrl', 'cast', 'isActive'];

const listMovies = asyncHandler(async (req, res) => {
  const result = await movieService.getMovies(req.query);
  res.json({ success: true, data: result });
});

const getMovie = asyncHandler(async (req, res) => {
  const movie = await movieService.getMovieById(req.params.id);
  res.json({ success: true, data: movie });
});

const createMovie = asyncHandler(async (req, res) => {
  try {
    const movie = await movieService.createMovie(pick(req.body, fields));
    res.status(201).json({ success: true, data: movie });
  } catch (error) {
    throw catchDuplicate(error);
  }
});

const updateMovie = asyncHandler(async (req, res) => {
  const movie = await movieService.updateMovie(req.params.id, pick(req.body, fields));
  res.json({ success: true, data: movie });
});

const deleteMovie = asyncHandler(async (req, res) => {
  const movie = await movieService.deleteMovie(req.params.id);
  res.json({ success: true, data: movie });
});

module.exports = { listMovies, getMovie, createMovie, updateMovie, deleteMovie };
