require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initializeSockets, closeSockets } = require('./sockets');

const port = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  const server = http.createServer(app);
  initializeSockets(server);
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  const shutdown = async () => {
    await closeSockets();
    await require('mongoose').connection.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error(`Server startup failed: ${err.message}`);
  process.exit(1);
});
