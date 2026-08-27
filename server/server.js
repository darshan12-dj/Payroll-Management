require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start listening immediately so the API (health check, static assets) is
// available even while MongoDB is still connecting or unreachable — a real
// "database connection failure" should degrade DB-backed routes, not take
// the whole process down.
const server = app.listen(PORT, () => {
  console.log(`[Server] Payroll API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

connectDB().catch(() => {
  console.error(
    '[Startup] Could not connect to MongoDB. The server is running, but API calls that touch the database will fail until MONGO_URI is reachable.'
  );
});

process.on('unhandledRejection', (err) => {
  console.error('[UnhandledRejection]', err);
});

module.exports = server;
