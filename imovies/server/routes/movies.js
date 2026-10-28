const express = require('express');
const { body, param, query } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const controller = require('../controllers/movieController');

const router = express.Router();
const pageValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
];
const idValidation = [param('id').isMongoId().withMessage('Invalid movie id')];
const createValidation = [
  body('title').isString().trim().notEmpty(),
  body('description').optional().isString().trim(),
  body('genres').optional().isArray(),
  body('genres.*').optional().isString().trim().notEmpty(),
  body('languages').optional().isArray(),
  body('languages.*').optional().isString().trim().notEmpty(),
  body('durationMins').isInt({ min: 1 }).toInt(),
  body('rating').optional().isIn(['U', 'UA', 'A', 'S']),
  body('releaseDate').isISO8601().toDate(),
  body('posterUrl').optional({ values: 'falsy' }).isURL({ require_protocol: true }),
  body('trailerUrl').optional({ values: 'falsy' }).isURL({ require_protocol: true }),
  body('cast').optional().isArray(),
  body('cast.*').optional().isString().trim().notEmpty(),
  body('isActive').optional().isBoolean().toBoolean(),
];
const updateValidation = [
  body('title').optional().isString().trim().notEmpty(),
  body('description').optional().isString().trim(),
  body('genres').optional().isArray(),
  body('genres.*').optional().isString().trim().notEmpty(),
  body('languages').optional().isArray(),
  body('languages.*').optional().isString().trim().notEmpty(),
  body('durationMins').optional().isInt({ min: 1 }).toInt(),
  body('rating').optional().isIn(['U', 'UA', 'A', 'S']),
  body('releaseDate').optional().isISO8601().toDate(),
  body('posterUrl').optional({ values: 'falsy' }).isURL({ require_protocol: true }),
  body('trailerUrl').optional({ values: 'falsy' }).isURL({ require_protocol: true }),
  body('cast').optional().isArray(),
  body('cast.*').optional().isString().trim().notEmpty(),
  body('isActive').optional().isBoolean().toBoolean(),
];

router.get('/', pageValidation.concat([
  query('q').optional().isString().trim(),
  query('genre').optional().isString().trim().notEmpty(),
  query('language').optional().isString().trim().notEmpty(),
  query('city').optional().isString().trim().notEmpty(),
  query('date').optional().isISO8601({ strict: true, strictSeparator: true }),
]), validateRequest, controller.listMovies);
router.post('/', protect, authorize('admin'), createValidation, validateRequest, controller.createMovie);
router.get('/:id', idValidation, validateRequest, controller.getMovie);
router.put('/:id', protect, authorize('admin'), idValidation, updateValidation, validateRequest, controller.updateMovie);
router.delete('/:id', protect, authorize('admin'), idValidation, validateRequest, controller.deleteMovie);

module.exports = router;
