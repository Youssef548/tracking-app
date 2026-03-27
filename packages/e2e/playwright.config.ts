import { defineConfig } from '@playwright/test';
import path from 'path';

const e2eDir = path.resolve(__dirname, '.');
const clientDir = path.resolve(__dirname, '../client');

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: `node "${path.resolve(e2eDir, 'start-server.js')}"`,
      port: 5000,
      reuseExistingServer: !process.env['CI'],
      timeout: 30000,
    },
    {
      command: `npx vite --port 3000`,
      port: 3000,
      reuseExistingServer: true,
      cwd: clientDir,
      timeout: 30000,
    },
  ],
});
