const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const showService = require('../services/showService');

const movieSeeds = [
  {
    title: 'The Last Orbit',
    description: 'A crew races to bring a silent orbital station back to life.',
    genres: ['Science Fiction', 'Adventure'],
    languages: ['English'],
    durationMins: 128,
    rating: 'UA',
    releaseDate: new Date('2026-10-01T00:00:00.000Z'),
    posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa',
    cast: ['Mira Sen', 'Arjun Rao'],
  },
  {
    title: 'Monsoon Letters',
    description: 'Two old friends reconnect through letters carried across the rainy season.',
    genres: ['Drama', 'Romance'],
    languages: ['English', 'Hindi'],
    durationMins: 116,
    rating: 'U',
    releaseDate: new Date('2026-09-18T00:00:00.000Z'),
    posterUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
    cast: ['Naina Kapoor', 'Dev Malhotra'],
  },
  {
    title: 'Paper Kingdom',
    description: 'A young illustrator discovers a city hidden inside her grandfather’s sketchbook.',
    genres: ['Fantasy', 'Family'],
    languages: ['English'],
    durationMins: 104,
    rating: 'U',
    releaseDate: new Date('2026-08-22T00:00:00.000Z'),
    posterUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353',
    cast: ['Rhea Das', 'Kabir Mehta'],
  },
  {
    title: 'City of Echoes',
    description: 'A sound engineer follows a trail of recordings through a changing city.',
    genres: ['Mystery', 'Thriller'],
    languages: ['English', 'Hindi'],
    durationMins: 121,
    rating: 'UA',
    releaseDate: new Date('2026-07-11T00:00:00.000Z'),
    posterUrl: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455',
    cast: ['Ishaan Verma', 'Tara Bose'],
  },
];

async function seed() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI must be configured before seeding');
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@imovies.local').toLowerCase();
    let admin = await User.findOne({ email: adminEmail }).select('+password');
    if (!admin) {
      admin = await User.create({
        name: process.env.SEED_ADMIN_NAME || 'IMovies Admin',
        email: adminEmail,
        password: process.env.SEED_ADMIN_PASSWORD || 'ChangeThisAdmin123!',
        role: 'admin',
      });
    } else if (admin.role !== 'admin') {
      admin.role = 'admin';
      await admin.save();
    }

    const movies = [];
    for (const movieData of movieSeeds) {
      const movie = await Movie.findOneAndUpdate(
        { title: movieData.title },
        { $set: { ...movieData, isActive: true } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
      movies.push(movie);
    }

    let theatre = await Theatre.findOne({ name: 'IMovies Central', city: 'Mumbai' });
    if (!theatre) {
      theatre = await Theatre.create({
        name: 'IMovies Central',
        city: 'Mumbai',
        address: 'Central District',
        screens: [{
          name: 'Screen 1',
          rows: [
            { row: 'A', seatCount: 8, type: 'regular' },
            { row: 'B', seatCount: 8, type: 'regular' },
            { row: 'C', seatCount: 6, type: 'premium' },
          ],
        }],
      });
    }

    const screen = theatre.screens[0];
    const firstShowDate = new Date();
    firstShowDate.setUTCDate(firstShowDate.getUTCDate() + 1);
    firstShowDate.setUTCHours(11, 0, 0, 0);
    const showSlots = [
      { movie: movies[0], startTime: firstShowDate },
      { movie: movies[1], startTime: new Date(firstShowDate.getTime() + 4 * 60 * 60 * 1000) },
    ];

    for (const { movie, startTime } of showSlots) {
      const duplicate = await Show.exists({ theatre: theatre._id, screenId: screen._id, startTime });
      if (!duplicate) {
        await showService.createShow({
          movie: movie._id,
          theatre: theatre._id,
          screenId: screen._id,
          language: movie.languages[0],
          startTime,
          endTime: new Date(startTime.getTime() + movie.durationMins * 60 * 1000),
        });
      }
    }

    console.log(`Seed complete: admin ${admin.email}, ${movies.length} movies, 1 theatre, 2 shows.`);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seed().catch((error) => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = seed;
