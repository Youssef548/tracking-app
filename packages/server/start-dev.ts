/**
 * Starts the server with an in-memory MongoDB.
 * No external MongoDB installation or auth needed.
 *
 * Usage: tsx start-dev.ts
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

async function main(): Promise<void> {
  const mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  console.log(`In-memory MongoDB started: ${uri}`);

  process.env['MONGO_URI'] = uri;
  process.env['JWT_SECRET'] = process.env['JWT_SECRET'] ?? 'dev-secret';
  process.env['PORT'] = process.env['PORT'] ?? '5000';

  await import('./src/index');

  const shutdown = async (): Promise<void> => {
    await mongo.stop();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err: Error) => {
  console.error('Failed to start dev server:', err);
  process.exit(1);
});
