const express = require('express');
const { body, param } = require('express-validator');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { hold, release } = require('../controllers/seatController');

const router = express.Router();
const validateSeatRequest = [
  param('id').isMongoId().withMessage('Invalid show id'),
  body('seats').isArray({ min: 1, max: 6 }).withMessage('Select between 1 and 6 seats'),
  body('seats.*').isString().trim().notEmpty(),
  body('seats').custom((seats) => Array.isArray(seats) && new Set(seats).size === seats.length)
    .withMessage('Seat labels must be unique'),
];

router.post('/:id/hold', protect, validateSeatRequest, validateRequest, hold);
router.delete('/:id/hold', protect, validateSeatRequest, validateRequest, release);

module.exports = router;
