const mongoose = require('mongoose');

async function connectDB() {
  const connection = await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB connected: ${connection.connection.host}`);
  return connection;
}

module.exports = connectDB;
