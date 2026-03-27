/**
 * Screenshot capture script for The Mindful Flow README.
 * Uses Playwright to spin up servers, seed demo data, and capture all pages.
 *
 * Usage: node packages/e2e/capture-screenshots.js
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { execSync, spawn } = require('child_process');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../../docs/screenshots');
const API_BASE = 'http://localhost:5000/api';
const CLIENT_URL = 'http://localhost:3000';

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_USER = {
  name: 'Alex Chen',
  email: `demo_${Date.now()}@mindfulflow.app`,
  password: 'demo123456',
};

const DEMO_HABITS = [
  { name: 'Morning Meditation', icon: 'self_improvement', color: 'secondary', frequency: 'daily', target: 1, description: '10 min mindfulness session' },
  { name: 'Evening Run',        icon: 'directions_run',  color: 'primary',   frequency: 'daily', target: 1, description: '5km outdoor run' },
  { name: 'Read Books',         icon: 'menu_book',       color: 'tertiary',  frequency: 'daily', target: 1, description: '30 pages per day' },
  { name: 'Drink Water',        icon: 'water_drop',      color: 'primary',   frequency: 'daily', target: 1, description: '8 glasses a day' },
  { name: 'Journaling',         icon: 'edit_note',       color: 'secondary', frequency: 'daily', target: 1, description: 'Daily reflection' },
  { name: 'Weekly Yoga',        icon: 'sports_gymnastics', color: 'tertiary', frequency: 'weekly', target: 3, description: 'Flow & stretch' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function dateStr(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

async function waitForPort(port, timeout = 30000) {
  const http = require('http');
  const start = Date.now();
  while (Date.now() - start < timeout) {
    await new Promise(resolve => {
      const req = http.get(`http://localhost:${port}`, () => { req.destroy(); resolve(true); });
      req.on('error', () => { resolve(false); });
    }).then(ok => ok ? Promise.resolve() : sleep(500));
    // Check if we've connected
    const connected = await new Promise(resolve => {
      const req = http.get(`http://localhost:${port}`, () => { req.destroy(); resolve(true); });
      req.on('error', () => resolve(false));
    });
    if (connected) return;
    await sleep(500);
  }
  throw new Error(`Port ${port} not ready after ${timeout}ms`);
}

// ─── Seed data via API ────────────────────────────────────────────────────────

async function seedData(token, habitIds) {
  const https = require('http');

  function apiCall(method, path, body, authToken) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const opts = {
        hostname: 'localhost',
        port: 5000,
        path: `/api${path}`,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      };
      const req = https.request(opts, res => {
        let raw = '';
        res.on('data', d => raw += d);
        res.on('end', () => {
          try { resolve(JSON.parse(raw)); } catch { resolve(raw); }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  // Register + login
  await apiCall('POST', '/auth/register', DEMO_USER);
  const loginRes = await apiCall('POST', '/auth/login', { email: DEMO_USER.email, password: DEMO_USER.password });
  const authToken = loginRes.token;

  // Create habits
  const createdHabits = [];
  for (const h of DEMO_HABITS) {
    const res = await apiCall('POST', '/habits', h, authToken);
    if (res.habit) createdHabits.push(res.habit);
  }

  // Log completions for the past 14 days (partial coverage for realism)
  const patterns = [
    [0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1], // habit 0
    [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0], // habit 1
    [0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1], // habit 2
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1], // habit 3
    [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1], // habit 4
  ];

  for (let h = 0; h < Math.min(createdHabits.length, patterns.length); h++) {
    for (let day = 0; day < 14; day++) {
      if (patterns[h][day]) {
        await apiCall('POST', '/completions', {
          habitId: createdHabits[h]._id,
          date: dateStr(day),
          value: 1,
        }, authToken);
      }
    }
  }

  return { authToken, habits: createdHabits };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Screenshots → ${OUT_DIR}\n`);

  // 1. Start MongoDB in-memory
  console.log('Starting MongoMemoryServer...');
  const mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();
  console.log(`  MongoDB: ${mongoUri}`);

  // 2. Start Express server
  console.log('Starting Express server...');
  const serverEnv = {
    ...process.env,
    MONGO_URI: mongoUri,
    JWT_SECRET: 'screenshot-secret',
    PORT: '5000',
    E2E: 'true',
    NODE_ENV: 'development',
  };
  const serverProcess = spawn('node', [path.resolve(__dirname, 'start-server.js')], {
    env: serverEnv,
    stdio: 'pipe',
  });
  serverProcess.stdout.on('data', d => process.stdout.write(`  [server] ${d}`));
  serverProcess.stderr.on('data', d => process.stderr.write(`  [server] ${d}`));

  await waitForPort(5000);
  console.log('  Express ready on :5000');

  // 3. Start Vite dev server
  console.log('Starting Vite dev server...');
  const clientDir = path.resolve(__dirname, '../client');
  const viteProcess = spawn('node', [
    path.resolve(__dirname, '../../node_modules/.bin/vite'),
    '--port', '3000',
    '--host', 'localhost',
  ], {
    cwd: clientDir,
    env: { ...process.env, NODE_ENV: 'development' },
    stdio: 'pipe',
  });
  viteProcess.stdout.on('data', d => process.stdout.write(`  [vite] ${d}`));
  viteProcess.stderr.on('data', d => process.stderr.write(`  [vite] ${d}`));

  await waitForPort(3000, 60000);
  console.log('  Vite ready on :3000');

  // 4. Seed demo data
  console.log('\nSeeding demo data...');
  const { authToken } = await seedData();
  console.log('  Done.');

  // 5. Launch Playwright
  console.log('\nLaunching browser...');
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'mobile',  width: 390,  height: 844 },
  ];

  for (const vp of viewports) {
    console.log(`\n── ${vp.name} (${vp.width}×${vp.height}) ──`);
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();

    // Inject token so we're logged in
    await page.goto(CLIENT_URL);
    await sleep(1500);
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, authToken);

    const shot = async (route, filename, waitFor) => {
      await page.goto(`${CLIENT_URL}${route}`);
      if (waitFor) await page.waitForSelector(waitFor, { timeout: 10000 }).catch(() => {});
      await sleep(1200); // let animations finish
      const p = path.join(OUT_DIR, `${filename}-${vp.name}.png`);
      await page.screenshot({ path: p, fullPage: false });
      console.log(`  ✓ ${path.basename(p)}`);
    };

    await shot('/',           'dashboard',  'text=Daily Rituals');
    await shot('/habits',     'habits',     'text=Habit Ecosystem');
    await shot('/calendar',   'calendar',   '.grid');
    await shot('/analytics',  'analytics',  'text=Weekly Flow');
    await shot('/login',      'login',      'input[type="email"]');
    await shot('/register',   'register',   'input[placeholder="Your name"]');

    await ctx.close();
  }

  await browser.close();

  // 6. Cleanup
  console.log('\nCleaning up...');
  serverProcess.kill();
  viteProcess.kill();
  await mongo.stop();

  console.log('\nDone! Screenshots saved to docs/screenshots/');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
