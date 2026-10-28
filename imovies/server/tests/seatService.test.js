const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Show = require('../models/Show');
const { holdSeats, releaseSeats, confirmSeats, cancelSeats } = require('../services/seatService');

let mongoServer;
let showId;

const seat = (label, state = {}) => ({
  label,
  row: label[0],
  number: Number(label.slice(1)),
  type: 'regular',
  price: 100,
  status: 'available',
  ...state,
});

const createShow = async (seats) => {
  const show = await Show.create({
    movie: new mongoose.Types.ObjectId(),
    theatre: new mongoose.Types.ObjectId(),
    screenId: new mongoose.Types.ObjectId(),
    language: 'English',
    startTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
    seats,
  });
  showId = show._id;
  return show;
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Show.deleteMany({});
});

test('only one of 20 parallel holds of the same seat succeeds', async () => {
  await createShow([seat('A1')]);
  const results = await Promise.all(
    Array.from({ length: 20 }, () =>
      holdSeats(showId, ['A1'], new mongoose.Types.ObjectId())
    )
  );

  expect(results.filter(Boolean)).toHaveLength(1);
});

test('another user can re-hold an expired seat', async () => {
  await createShow([seat('A1', {
    status: 'held',
    heldBy: new mongoose.Types.ObjectId(),
    heldUntil: new Date(Date.now() - 1000),
  })]);

  await expect(holdSeats(showId, ['A1'], new mongoose.Types.ObjectId())).resolves.toBe(true);
});

test('confirm fails for a non-owner and for an expired hold', async () => {
  const owner = new mongoose.Types.ObjectId();
  await createShow([seat('A1', {
    status: 'held',
    heldBy: owner,
    heldUntil: new Date(Date.now() + 60_000),
  })]);

  await expect(confirmSeats(showId, ['A1'], new mongoose.Types.ObjectId())).resolves.toBe(false);
  await Show.updateOne(
    { _id: showId },
    { $set: { 'seats.0.heldUntil': new Date(Date.now() - 1000) } }
  );
  await expect(confirmSeats(showId, ['A1'], owner)).resolves.toBe(false);
});

test('a multi-seat hold fails atomically if one seat is already taken', async () => {
  await createShow([
    seat('A1'),
    seat('A2', { status: 'booked' }),
    seat('A3'),
  ]);
  const userId = new mongoose.Types.ObjectId();

  await expect(holdSeats(showId, ['A1', 'A2', 'A3'], userId)).resolves.toBe(false);
  const stored = await Show.findById(showId).lean();
  expect(stored.seats.map(({ status }) => status)).toEqual(['available', 'booked', 'available']);
});
