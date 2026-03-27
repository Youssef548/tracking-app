const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const Notification = require('../src/models/Notification');

async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
};

let token;
let userId;
let habitId;
let completionId;
let notificationId;

// Helper: register and get token
async function registerAndGetToken(user = testUser) {
  const res = await request(app).post('/api/auth/register').send(user);
  return { token: res.body.token, userId: res.body.user._id };
}

// ─── Auth ────────────────────────────────────────────────────────────

describe('Auth endpoints', () => {
  beforeAll(async () => {
    await clearDB();
  });

  it('POST /register — should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', testUser.email);
    token = res.body.token;
    userId = res.body.user._id;
  });

  it('POST /register — should reject duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('POST /register — should reject missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('POST /login — should login with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('POST /login — should reject invalid password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('POST /login — should reject non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nope@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });

  it('GET /me — should return current user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty('email', testUser.email);
  });

  it('GET /me — should reject without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /me — should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });

  it('PUT /profile — should update profile', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Updated Name');
  });
});

// ─── Habits ──────────────────────────────────────────────────────────

describe('Habits endpoints', () => {
  beforeAll(async () => {
    await clearDB();
    const auth = await registerAndGetToken();
    token = auth.token;
    userId = auth.userId;
  });

  it('POST /habits — should create a habit', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Meditate', frequency: 'daily' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('name', 'Meditate');
    expect(res.body).toHaveProperty('frequency', 'daily');
    habitId = res.body._id;
  });

  it('POST /habits — should reject without auth', async () => {
    const res = await request(app)
      .post('/api/habits')
      .send({ name: 'Read', frequency: 'daily' });
    expect(res.status).toBe(401);
  });

  it('POST /habits — should reject invalid data', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' });
    expect(res.status).toBe(400);
  });

  it('GET /habits — should return user habits', async () => {
    const res = await request(app)
      .get('/api/habits')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('PUT /habits/:id — should update a habit', async () => {
    const res = await request(app)
      .put(`/api/habits/${habitId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Morning Meditation' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Morning Meditation');
  });

  it('PUT /habits/:id — should return 404 for non-existent habit', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/habits/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ghost' });
    expect(res.status).toBe(404);
  });

  it('DELETE /habits/:id — should soft-delete a habit', async () => {
    const res = await request(app)
      .delete(`/api/habits/${habitId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(false);
  });

  it('GET /habits — should not list soft-deleted habits by default', async () => {
    const res = await request(app)
      .get('/api/habits')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.length).toBe(0);
  });
});

// ─── Completions ─────────────────────────────────────────────────────

describe('Completions endpoints', () => {
  beforeAll(async () => {
    await clearDB();
    const auth = await registerAndGetToken();
    token = auth.token;
    userId = auth.userId;

    const habitRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Exercise', frequency: 'daily' });
    habitId = habitRes.body._id;
  });

  it('POST /completions — should log a completion', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request(app)
      .post('/api/completions')
      .set('Authorization', `Bearer ${token}`)
      .send({ habitId, date: today });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('habitId', habitId);
    completionId = res.body._id;
  });

  it('POST /completions — should reject duplicate completion', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request(app)
      .post('/api/completions')
      .set('Authorization', `Bearer ${token}`)
      .send({ habitId, date: today });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE');
  });

  it('POST /completions — should reject non-existent habit', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post('/api/completions')
      .set('Authorization', `Bearer ${token}`)
      .send({ habitId: fakeId, date: '2025-01-01' });
    expect(res.status).toBe(404);
  });

  it('GET /completions — should return completions', async () => {
    const res = await request(app)
      .get('/api/completions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /completions — should filter by date', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request(app)
      .get(`/api/completions?date=${today}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('DELETE /completions/:id — should delete a completion', async () => {
    const res = await request(app)
      .delete(`/api/completions/${completionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('DELETE /completions/:id — should return 404 for non-existent', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/completions/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

// ─── Analytics ───────────────────────────────────────────────────────

describe('Analytics endpoints', () => {
  beforeAll(async () => {
    await clearDB();
    const auth = await registerAndGetToken();
    token = auth.token;
    userId = auth.userId;

    const habitRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Read', frequency: 'daily' });
    habitId = habitRes.body._id;

    const today = new Date().toISOString().split('T')[0];
    await request(app)
      .post('/api/completions')
      .set('Authorization', `Bearer ${token}`)
      .send({ habitId, date: today });
  });

  it('GET /analytics/weekly — should return weekly analytics', async () => {
    const res = await request(app)
      .get('/api/analytics/weekly')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('score');
    expect(res.body).toHaveProperty('completedCount');
    expect(res.body).toHaveProperty('targetCount');
    expect(res.body).toHaveProperty('streak');
    expect(res.body).toHaveProperty('dayData');
    expect(Array.isArray(res.body.dayData)).toBe(true);
  });

  it('GET /analytics/weekly — should reject without auth', async () => {
    const res = await request(app).get('/api/analytics/weekly');
    expect(res.status).toBe(401);
  });

  it('GET /analytics/monthly — should return monthly analytics', async () => {
    const now = new Date();
    const res = await request(app)
      .get(`/api/analytics/monthly?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('month');
    expect(res.body).toHaveProperty('year');
    expect(res.body).toHaveProperty('days');
  });

  it('GET /analytics/habits/:id — should return habit analytics', async () => {
    const res = await request(app)
      .get(`/api/analytics/habits/${habitId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('completionRate');
    expect(res.body).toHaveProperty('recentCompletions');
    expect(res.body).toHaveProperty('streakDays');
  });

  it('GET /analytics/habits/:id — should return 404 for non-existent', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/analytics/habits/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

// ─── Notifications ───────────────────────────────────────────────────

describe('Notifications endpoints', () => {
  beforeAll(async () => {
    await clearDB();
    const auth = await registerAndGetToken();
    token = auth.token;
    userId = auth.userId;

    const n = await Notification.create({
      userId,
      type: 'streak',
      title: 'Great streak!',
      message: 'You have a 7-day streak!',
      isRead: false,
    });
    notificationId = n._id.toString();

    await Notification.create({
      userId,
      type: 'tip',
      title: 'Daily tip',
      message: 'Stay hydrated!',
      isRead: false,
    });
  });

  it('GET /notifications — should return notifications', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it('GET /notifications — should reject without auth', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  it('PUT /notifications/:id/read — should mark as read', async () => {
    const res = await request(app)
      .put(`/api/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.isRead).toBe(true);
  });

  it('PUT /notifications/:id/read — should return 404 for non-existent', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/notifications/${fakeId}/read`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('PUT /notifications/read-all — should mark all as read', async () => {
    const res = await request(app)
      .put('/api/notifications/read-all')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);

    const check = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    const unread = check.body.filter((n) => !n.isRead);
    expect(unread.length).toBe(0);
  });
});

// ─── Health check ────────────────────────────────────────────────────

describe('Health check', () => {
  it('GET /api/health — should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
