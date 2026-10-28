const Booking = require('../models/Booking');
const Show = require('../models/Show');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const { cancelSeats } = require('./seatService');
const { pagination, requireId, notFound } = require('../utils/serviceHelpers');

async function confirmBooking(bookingId, userId, paymentId) {
  return Booking.findOneAndUpdate(
    { _id: bookingId, user: userId, status: 'pending' },
    { $set: { status: 'confirmed', payment: paymentId } },
    { new: true }
  );
}

async function getMyBookings(userId, filters = {}) {
  const { page, limit, skip } = pagination(filters);
  const query = { user: userId };
  if (filters.status) query.status = filters.status;

  const [items, total] = await Promise.all([
    Booking.find(query)
      .populate({ path: 'show', populate: [
        { path: 'movie', select: 'title posterUrl durationMins' },
        { path: 'theatre', select: 'name city address' },
      ] })
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(query),
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getBookingById(bookingId, userId) {
  requireId(bookingId, 'Booking');
  const booking = await Booking.findOne({ _id: bookingId, user: userId })
    .populate({ path: 'show', populate: [
      { path: 'movie', select: 'title posterUrl durationMins' },
      { path: 'theatre', select: 'name city address' },
    ] })
    .lean();
  if (!booking) notFound('Booking not found');
  return booking;
}

async function cancelBooking({ bookingId, userId }) {
  requireId(bookingId, 'Booking');
  const booking = await Booking.findOne({ _id: bookingId, user: userId });
  if (!booking) notFound('Booking not found');
  if (booking.status !== 'confirmed') throw new ApiError(409, 'Only confirmed bookings can be cancelled');

  const show = await Show.findById(booking.show).select('startTime').lean();
  if (!show) notFound('Show not found');
  const cutoffMinutes = Number.parseInt(process.env.CANCEL_CUTOFF_MINS, 10) || 120;
  if (show.startTime <= new Date(Date.now() + cutoffMinutes * 60 * 1000)) {
    throw new ApiError(409, 'Booking cancellation cutoff has passed');
  }

  const seatsCancelled = await cancelSeats(booking.show, booking.seats);
  if (!seatsCancelled) throw new ApiError(409, 'Booking seats could not be cancelled');

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  await booking.save();
  await Notification.create({
    user: userId,
    type: 'booking_cancelled',
    message: `Booking ${booking._id} was cancelled.`,
  });
  return booking;
}

module.exports = { confirmBooking, getMyBookings, getBookingById, cancelBooking };
