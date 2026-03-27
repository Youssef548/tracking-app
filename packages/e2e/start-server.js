/**
 * Starts an in-memory MongoDB + the Express server for E2E tests.
 * No external MongoDB required.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  // 1. Start in-memory MongoDB
  const mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  console.log(`E2E MongoMemoryServer started: ${uri}`);

  // 2. Set env vars before requiring the server
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = 'e2e-test-secret';
  process.env.PORT = process.env.PORT || '5000';
  process.env.E2E = 'true';
  process.env.NODE_ENV = 'e2e'; // ensure server calls app.listen() (not blocked by NODE_ENV=test guard)

  // 3. Require the server — it will connect to mongo and start listening
  require('../server/src/index');

  // 4. Graceful shutdown
  const shutdown = async () => {
    await mongo.stop();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Failed to start E2E server:', err);
  process.exit(1);
});
