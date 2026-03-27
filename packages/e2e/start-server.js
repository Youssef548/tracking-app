/**
 * Starts an in-memory MongoDB + the Express server for E2E tests.
 * No external MongoDB required.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const { spawn } = require('child_process');
const path = require('path');

async function main() {
  // 1. Start in-memory MongoDB
  const mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  console.log(`E2E MongoMemoryServer started: ${uri}`);

  // 2. Set env vars before spawning the server
  const serverIndex = path.resolve(__dirname, '../server/src/index.ts');
  const serverDir = path.resolve(__dirname, '../server');
  const env = {
    ...process.env,
    MONGO_URI: uri,
    JWT_SECRET: 'e2e-test-secret',
    PORT: process.env.PORT || '5000',
    E2E: 'true',
    NODE_ENV: 'e2e', // ensure server calls app.listen() (not blocked by NODE_ENV=test guard)
  };

  // 3. Spawn the server using npx tsx so it can run TypeScript directly
  // Use 'npx' + 'tsx' which resolves via PATH (tsx is in packages/server/node_modules/.bin)
  const isWindows = process.platform === 'win32';
  const tsxCmd = isWindows ? 'tsx.CMD' : 'tsx';
  const tsxBin = path.resolve(serverDir, 'node_modules/.bin', tsxCmd);

  const serverProcess = spawn(tsxBin, [serverIndex], {
    env,
    stdio: 'inherit',
    cwd: serverDir,
    shell: isWindows, // Windows .CMD files require shell: true
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server process:', err);
    process.exit(1);
  });

  // 4. Graceful shutdown
  const shutdown = async () => {
    serverProcess.kill();
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
