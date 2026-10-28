const mongoose = require('mongoose');

// Seats are EMBEDDED so a multi-seat hold/booking is one atomic single-document update.
const seatSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // 'A1'
    row: { type: String, required: true },
    number: { type: Number, required: true },
    type: { type: String, enum: ['regular', 'premium'], default: 'regular' },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['available', 'held', 'booked'], default: 'available' },
    heldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    heldUntil: { type: Date, default: null },
  },
  { _id: false }
);

const showSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },
    screenId: { type: mongoose.Schema.Types.ObjectId, required: true },
    language: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    seats: [seatSchema],
  },
  { timestamps: true }
);

showSchema.index({ movie: 1, startTime: 1 });
showSchema.index({ theatre: 1, startTime: 1 });
// Prevent overlapping duplicates of the same slot on a screen
showSchema.index({ theatre: 1, screenId: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Show', showSchema);
