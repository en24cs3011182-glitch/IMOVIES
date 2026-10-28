const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const controller = require('../controllers/paymentController');

const router = express.Router();
const seatSelection = [
  body('showId').isMongoId(),
  body('seats').isArray({ min: 1, max: 6 }),
  body('seats.*').isString().trim().notEmpty(),
  body('seats').custom((seats) => Array.isArray(seats) && new Set(seats).size === seats.length)
    .withMessage('Seat labels must be unique'),
];

router.post('/initiate', protect, seatSelection, validateRequest, controller.initiate);
router.post('/verify', protect, [
  body('paymentId').isMongoId(),
  body('result').isIn(['success', 'failure']),
], validateRequest, controller.verify);

module.exports = router;
