const asyncHandler = require('../utils/asyncHandler');
const bookingService = require('../services/bookingService');

const listMine = asyncHandler(async (req, res) => {
  const result = await bookingService.getMyBookings(req.user._id, req.query);
  res.json({ success: true, data: result });
});

const getOne = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user._id);
  res.json({ success: true, data: booking });
});

const cancel = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking({
    bookingId: req.params.id,
    userId: req.user._id,
  });
  res.json({ success: true, data: booking });
});

module.exports = { listMine, getOne, cancel };
