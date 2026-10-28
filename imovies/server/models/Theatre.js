const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    // Layout template used to generate Show.seats when a show is created
    rows: [
      {
        row: { type: String, required: true }, // 'A', 'B', ...
        seatCount: { type: Number, required: true, min: 1 },
        type: { type: String, enum: ['regular', 'premium'], default: 'regular' },
      },
    ],
  },
  { _id: true }
);

const theatreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: String,
    screens: [screenSchema],
  },
  { timestamps: true }
);

theatreSchema.index({ city: 1, name: 1 });

module.exports = mongoose.model('Theatre', theatreSchema);
