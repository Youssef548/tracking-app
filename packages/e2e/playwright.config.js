const { defineConfig } = require('@playwright/test');
const path = require('path');

const serverDir = path.resolve(__dirname, '../server');
const clientDir = path.resolve(__dirname, '../client');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: `node "${path.resolve(__dirname, 'start-server.js')}"`,
      port: 5000,
      reuseExistingServer: false,
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
