const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['initiated', 'processing', 'success', 'failed'],
      default: 'initiated',
    },
    gatewayRef: { type: String, trim: true },
  },
  { timestamps: true }
);

paymentSchema.index({ booking: 1 }, { unique: true });
paymentSchema.index({ user: 1, status: 1, createdAt: -1 });
paymentSchema.index({ gatewayRef: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Payment', paymentSchema);
