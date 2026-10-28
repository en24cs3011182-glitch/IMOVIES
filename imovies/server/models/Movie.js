const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    genres: [{ type: String, trim: true }],
    languages: [{ type: String, trim: true }],
    durationMins: { type: Number, required: true, min: 1 },
    rating: { type: String, enum: ['U', 'UA', 'A', 'S'], default: 'UA' },
    releaseDate: { type: Date, required: true },
    posterUrl: String,
    trailerUrl: String,
    cast: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

movieSchema.index({ title: 'text', description: 'text' });
// MongoDB cannot build a compound multikey index over both array fields.
movieSchema.index({ genres: 1, isActive: 1 });
movieSchema.index({ languages: 1, isActive: 1 });
movieSchema.index({ releaseDate: -1 });

module.exports = mongoose.model('Movie', movieSchema);
