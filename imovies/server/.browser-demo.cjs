process.env.JWT_SECRET = 'temporary-browser-walkthrough-secret';
process.env.JWT_EXPIRES_IN = '1d';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.NODE_ENV = 'development';
process.env.SEAT_HOLD_MINS = '5';
process.env.CANCEL_CUTOFF_MINS = '120';
process.env.SEAT_PRICE_REGULAR = '180';
process.env.SEAT_PRICE_PREMIUM = '260';

const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./app');
const User = require('./models/User');
const Movie = require('./models/Movie');
const Theatre = require('./models/Theatre');
const Show = require('./models/Show');
const generateSeats = require('./utils/generateSeats');
const { initializeSockets, closeSockets } = require('./sockets');

(async () => {
  const database = await MongoMemoryServer.create();
  await mongoose.connect(database.getUri());
  await Promise.all([User.init(), Movie.init(), Theatre.init(), Show.init()]);
  await User.create({ name: 'Demo Admin', email: 'admin@imovies.local', password: 'CinemaAdmin123', role: 'admin' });
  const [movie] = await Movie.create([
    { title: 'The Clockwork Garden', description: 'An inventive adventure about a city that grows its own memories.', genres: ['Adventure', 'Drama'], languages: ['English'], durationMins: 118, rating: 'UA', releaseDate: new Date(), cast: ['Ari Lane', 'Sam River'] },
    { title: 'Midnight on Maple Street', description: 'A gentle comedy unfolds over one unexpected evening.', genres: ['Comedy'], languages: ['English'], durationMins: 102, rating: 'U', releaseDate: new Date() },
    { title: 'After the Last Train', description: 'Two strangers find the courage to begin again.', genres: ['Drama', 'Romance'], languages: ['English'], durationMins: 110, rating: 'UA', releaseDate: new Date() },
  ]);
  const theatre = await Theatre.create({ name: 'Starlight Cinema', city: 'Mumbai', address: '18 Marine View Road', screens: [{ name: 'Screen 1', rows: [{ row: 'A', seatCount: 6, type: 'regular' }, { row: 'B', seatCount: 6, type: 'premium' }, { row: 'C', seatCount: 6, type: 'regular' }] }] });
  const screen = theatre.screens[0];
  const start = new Date(Date.now() + 6 * 60 * 60 * 1000);
  await Show.create({ movie: movie._id, theatre: theatre._id, screenId: screen._id, language: 'English', startTime: start, endTime: new Date(start.getTime() + 118 * 60000), seats: generateSeats(screen, { regular: 180, premium: 260 }) });
  const tomorrow = new Date(Date.now() + 30 * 60 * 60 * 1000);
  await Show.create({ movie: movie._id, theatre: theatre._id, screenId: screen._id, language: 'English', startTime: tomorrow, endTime: new Date(tomorrow.getTime() + 118 * 60000), seats: generateSeats(screen, { regular: 180, premium: 260 }) });

  const server = http.createServer(app);
  initializeSockets(server);
  server.listen(5000, () => console.log('Temporary API ready on port 5000 with in-memory data.'));
  const cleanup = async () => {
    await closeSockets();
    await mongoose.disconnect();
    await database.stop();
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
})().catch((error) => { console.error('Temporary API failed:', error.message); process.exit(1); });
