const express = require('express');
const { body, param, query } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const controller = require('../controllers/theatreController');

const router = express.Router();
const pageValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
];
const idValidation = [param('id').isMongoId().withMessage('Invalid theatre id')];
const screenValidation = [
  body('screens').isArray({ min: 1 }),
  body('screens.*.name').isString().trim().notEmpty(),
  body('screens.*.rows').isArray({ min: 1 }),
  body('screens.*.rows.*.row').isString().trim().notEmpty(),
  body('screens.*.rows.*.seatCount').isInt({ min: 1 }).toInt(),
  body('screens.*.rows.*.type').optional().isIn(['regular', 'premium']),
];
const updateScreens = [
  body('screens').optional().isArray({ min: 1 }),
  body('screens.*.name').if(body('screens').exists()).isString().trim().notEmpty(),
  body('screens.*.rows').if(body('screens').exists()).isArray({ min: 1 }),
  body('screens.*.rows.*.row').if(body('screens').exists()).isString().trim().notEmpty(),
  body('screens.*.rows.*.seatCount').if(body('screens').exists()).isInt({ min: 1 }).toInt(),
  body('screens.*.rows.*.type').optional().isIn(['regular', 'premium']),
];

router.get('/', pageValidation.concat([
  query('city').optional().isString().trim().notEmpty(),
]), validateRequest, controller.listTheatres);
router.post('/', protect, authorize('admin'), [
  body('name').isString().trim().notEmpty(),
  body('city').isString().trim().notEmpty(),
  body('address').optional().isString().trim(),
  ...screenValidation,
], validateRequest, controller.createTheatre);
router.get('/:id', idValidation, validateRequest, controller.getTheatre);
router.put('/:id', protect, authorize('admin'), idValidation, [
  body('name').optional().isString().trim().notEmpty(),
  body('city').optional().isString().trim().notEmpty(),
  body('address').optional().isString().trim(),
  ...updateScreens,
], validateRequest, controller.updateTheatre);
router.delete('/:id', protect, authorize('admin'), idValidation, validateRequest, controller.deleteTheatre);

module.exports = router;
