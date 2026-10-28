const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const Show = require('../models/Show');
const ApiError = require('../utils/ApiError');
const gateway = require('./paymentGateway');
const { confirmSeats, releaseSeats } = require('./seatService');
const { requireId, notFound } = require('../utils/serviceHelpers');
const { confirmBooking } = require('./bookingService');

function validLabels(labels) {
  return Array.isArray(labels) && labels.length > 0 && labels.length <= 6 &&
    labels.every((label) => typeof label === 'string' && label.length > 0) &&
    new Set(labels).size === labels.length;
}

async function initiatePayment({ showId, labels, userId }) {
  requireId(showId, 'Show');
  if (!validLabels(labels)) throw new ApiError(400, 'Select between 1 and 6 unique seats');

  const show = await Show.findById(showId).select('seats').lean();
  if (!show) notFound('Show not found');
  const selectedSeats = show.seats.filter(({ label }) => labels.includes(label));
  const now = new Date();
  const ownsActiveHolds = selectedSeats.length === labels.length && selectedSeats.every((seat) =>
    seat.status === 'held' && String(seat.heldBy) === String(userId) && seat.heldUntil > now
  );
  if (!ownsActiveHolds) throw new ApiError(409, 'One or more seats are not held by this user');

  const amount = selectedSeats.reduce((total, seat) => total + seat.price, 0);
  const booking = await Booking.create({
    user: userId,
    show: showId,
    seats: labels,
    amount,
    status: 'pending',
  });

  let payment;
  try {
    const gatewaySession = await gateway.initiate(booking);
    payment = await Payment.create({
      booking: booking._id,
      user: userId,
      amount,
      method: 'mock',
      status: 'initiated',
      gatewayRef: gatewaySession.gatewayRef,
    });
    booking.payment = payment._id;
    await booking.save();
    return { booking, payment };
  } catch (error) {
    if (payment) await Payment.deleteOne({ _id: payment._id });
    await Booking.deleteOne({ _id: booking._id });
    throw error;
  }
}

async function failPayment(payment, booking) {
  await releaseSeats(booking.show, booking.seats, payment.user);
  const updatedBooking = await Booking.findOneAndUpdate(
    { _id: booking._id, status: 'pending' },
    { $set: { status: 'failed', payment: payment._id } },
    { new: true }
  );
  const updatedPayment = await Payment.findOneAndUpdate(
    { _id: payment._id, status: 'processing' },
    { $set: { status: 'failed' } },
    { new: true }
  );
  return { payment: updatedPayment || payment, booking: updatedBooking || booking };
}

async function verifyPayment({ paymentId, userId, result }) {
  requireId(paymentId, 'Payment');
  const initial = await Payment.findOne({ _id: paymentId, user: userId });
  if (!initial) notFound('Payment not found');

  if (initial.status === 'success' || initial.status === 'failed') {
    const booking = await Booking.findOne({ _id: initial.booking, user: userId });
    return { payment: initial, booking };
  }
  if (initial.status === 'processing') throw new ApiError(409, 'Payment verification is already in progress');

  const payment = await Payment.findOneAndUpdate(
    { _id: paymentId, user: userId, status: 'initiated' },
    { $set: { status: 'processing' } },
    { new: true }
  );
  if (!payment) throw new ApiError(409, 'Payment verification is already in progress');

  const booking = await Booking.findOne({ _id: payment.booking, user: userId });
  if (!booking) notFound('Booking not found');

  let verification;
  try {
    verification = await gateway.verify(payment, result);
  } catch (error) {
    await Payment.updateOne({ _id: payment._id, status: 'processing' }, { $set: { status: 'initiated' } });
    throw error;
  }

  if (!verification.success) return failPayment(payment, booking);

  const seatsConfirmed = await confirmSeats(booking.show, booking.seats, userId);
  if (!seatsConfirmed) return failPayment(payment, booking);

  const updatedBooking = await confirmBooking(booking._id, userId, payment._id);
  if (!updatedBooking) throw new ApiError(409, 'Booking is no longer pending');
  const updatedPayment = await Payment.findOneAndUpdate(
    { _id: payment._id, status: 'processing' },
    { $set: { status: 'success' } },
    { new: true }
  );

  await Notification.create({
    user: userId,
    type: 'booking_confirmed',
    message: `Booking ${booking._id} is confirmed.`,
  });

  return { payment: updatedPayment, booking: updatedBooking };
}

module.exports = { initiatePayment, verifyPayment };
