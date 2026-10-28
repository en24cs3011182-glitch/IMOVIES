const express = require('express');
const { body } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const { protect, getTokenSecret } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const jwt = require('jsonwebtoken');

const router = express.Router();

function publicUser(user) {
  const result = user.toObject();
  delete result.password;
  delete result.__v;
  return result;
}

function createToken(userId) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
  return jwt.sign({ id: userId.toString() }, getTokenSecret(), { expiresIn });
}

router.post(
  '/register',
  [
    body('name').isString().trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
    body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('phone').optional({ values: 'falsy' }).isString().trim(),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;
    const existing = await User.exists({ email });
    if (existing) throw new ApiError(409, 'Email is already registered');

    try {
      const user = await User.create({ name, email, password, phone });
      return res.status(201).json({
        success: true,
        data: { user: publicUser(user), token: createToken(user._id) },
      });
    } catch (error) {
      if (error.code === 11000) throw new ApiError(409, 'Email is already registered');
      throw error;
    }
  })
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
    body('password').isString().notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      throw new ApiError(401, 'Invalid email or password');
    }

    return res.json({
      success: true,
      data: { user: publicUser(user), token: createToken(user._id) },
    });
  })
);

router.get(
  '/me',
  protect,
  (req, res) => res.json({ success: true, data: { user: publicUser(req.user) } })
);

module.exports = router;
