const Show = require('../models/Show');
const { emitSeatsUpdated } = require('../sockets');

const uniqueLabels = (labels) =>
  Array.isArray(labels) && labels.length > 0 &&
  labels.every((label) => typeof label === 'string' && label.length > 0) &&
  new Set(labels).size === labels.length;

const labelConditions = (labels, condition) =>
  labels.map((label) => ({ seats: { $elemMatch: { label, ...condition } } }));

async function updateSeats(showId, labels, condition, update, arrayFilter, extraFilter = {}) {
  if (!showId || !uniqueLabels(labels)) return false;

  try {
    const result = await Show.updateOne(
      { _id: showId, ...extraFilter, $and: labelConditions(labels, condition) },
      update,
      { arrayFilters: [{ 'seat.label': { $in: labels }, ...arrayFilter }] }
    );
    const modified = result.modifiedCount === 1;
    if (modified) await emitSeatsUpdated(showId, labels);
    return modified;
  } catch (error) {
    return false;
  }
}

async function holdSeats(showId, labels, userId) {
  if (!userId) return false;
  const now = new Date();
  const holdMinutes = Number.parseInt(process.env.SEAT_HOLD_MINS, 10) || 5;
  return updateSeats(
    showId,
    labels,
    {
      $or: [
        { status: 'available' },
        { status: 'held', heldUntil: { $lte: now } },
      ],
    },
    {
      $set: {
        'seats.$[seat].status': 'held',
        'seats.$[seat].heldBy': userId,
        'seats.$[seat].heldUntil': new Date(now.getTime() + holdMinutes * 60 * 1000),
      },
    },
    {}
  );
}

async function releaseSeats(showId, labels, userId) {
  if (!userId) return false;
  return updateSeats(
    showId,
    labels,
    { status: 'held', heldBy: userId },
    {
      $set: {
        'seats.$[seat].status': 'available',
        'seats.$[seat].heldBy': null,
        'seats.$[seat].heldUntil': null,
      },
    },
    { 'seat.status': 'held', 'seat.heldBy': userId }
  );
}

async function confirmSeats(showId, labels, userId) {
  if (!userId) return false;
  const now = new Date();
  return updateSeats(
    showId,
    labels,
    { status: 'held', heldBy: userId, heldUntil: { $gt: now } },
    {
      $set: {
        'seats.$[seat].status': 'booked',
        'seats.$[seat].heldBy': null,
        'seats.$[seat].heldUntil': null,
      },
    },
    { 'seat.status': 'held', 'seat.heldBy': userId, 'seat.heldUntil': { $gt: now } }
  );
}

async function cancelSeats(showId, labels) {
  const cutoffMinutes = Number.parseInt(process.env.CANCEL_CUTOFF_MINS, 10) || 120;
  return updateSeats(
    showId,
    labels,
    { status: 'booked' },
    {
      $set: {
        'seats.$[seat].status': 'available',
        'seats.$[seat].heldBy': null,
        'seats.$[seat].heldUntil': null,
      },
    },
    { 'seat.status': 'booked' },
    { startTime: { $gt: new Date(Date.now() + cutoffMinutes * 60 * 1000) } }
  );
}

module.exports = { holdSeats, releaseSeats, confirmSeats, cancelSeats };
