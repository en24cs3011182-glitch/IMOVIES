const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { holdSeats, releaseSeats } = require('../services/seatService');
const Show = require('../models/Show');

const hold = asyncHandler(async (req, res) => {
  const held = await holdSeats(req.params.id, req.body.seats, req.user._id);
  if (!held) throw new ApiError(409, 'One or more seats are unavailable');

  const show = await Show.findOne({
    _id: req.params.id,
    seats: { $elemMatch: { label: req.body.seats[0], heldBy: req.user._id, status: 'held' } },
  }, { 'seats.$': 1 }).lean();
  res.json({ success: true, data: { heldUntil: show?.seats?.[0]?.heldUntil || null } });
});

const release = asyncHandler(async (req, res) => {
  const released = await releaseSeats(req.params.id, req.body.seats, req.user._id);
  if (!released) throw new ApiError(409, 'One or more seats are not held by this user');
  res.json({ success: true, data: { released: true } });
});

module.exports = { hold, release };
