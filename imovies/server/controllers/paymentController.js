const paymentService = require('../services/paymentService');
const asyncHandler = require('../utils/asyncHandler');

const initiate = asyncHandler(async (req, res) => {
  const result = await paymentService.initiatePayment({
    showId: req.body.showId,
    labels: req.body.seats,
    userId: req.user._id,
  });
  res.status(201).json({
    success: true,
    data: {
      bookingId: result.booking._id,
      paymentId: result.payment._id,
      amount: result.booking.amount,
      // Retain the existing response fields used by the current client.
      booking: result.booking,
      payment: result.payment,
    },
  });
});

const verify = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyPayment({
    paymentId: req.body.paymentId,
    userId: req.user._id,
    result: req.body.result,
  });
  res.json({ success: true, data: result });
});

module.exports = { initiate, verify };
