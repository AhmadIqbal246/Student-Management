import app from './app.js';
import env from './config/env.js';
import { closePool, verifyConnection } from './config/db.js';

const start = async () => {
  try {
    await verifyConnection();
    console.log(`Connected to PostgreSQL database "${env.db.database}"`);
  } catch (err) {
    console.error('Could not connect to PostgreSQL:', err.message);
    console.error('Check the DB_* values in .env and that the database exists (npm run db:setup).');
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`Server running in ${env.nodeEnv} mode at http://localhost:${env.port}/api`);
  });

  // Graceful shutdown: stop taking new requests, finish the ones in flight, then close the DB pool.
  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
    // Force exit if connections don't close in time.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
  process.exit(1);
});

start();
