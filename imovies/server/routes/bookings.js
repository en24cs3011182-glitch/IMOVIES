const express = require('express');
const { param, query } = require('express-validator');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const controller = require('../controllers/bookingController');

const router = express.Router();
router.get('/me', protect, [
  query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'failed']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
], validateRequest, controller.listMine);
router.get('/:id', protect, [
  param('id').isMongoId().withMessage('Invalid booking id'),
], validateRequest, controller.getOne);
router.post('/:id/cancel', protect, [
  param('id').isMongoId().withMessage('Invalid booking id'),
], validateRequest, controller.cancel);

module.exports = router;
