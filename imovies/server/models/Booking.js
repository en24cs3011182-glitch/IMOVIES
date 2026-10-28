const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
    seats: [{ type: String, required: true }], // labels
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'failed'],
      default: 'pending',
    },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    cancelledAt: Date,
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ show: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
