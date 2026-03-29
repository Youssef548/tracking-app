import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/index';
import Notification from '../src/models/Notification';

async function clearDB(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key]!.deleteMany({});
  }
}

const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
};

let token: string;
let userId: string;
let habitId: string;
let completionId: string;
let notificationId: string;

// Helper: register and get token
async function registerAndGetToken(
  user = testUser,
): Promise<{ token: string; userId: string }> {
  const res = await request(app).post('/api/auth/register').send(user);
  return { token: res.body.token as string, userId: res.body.user._id as string };
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
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
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

// ─── Profile update ──────────────────────────────────────────────────

describe('Profile update', () => {
  let profileToken: string;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Profile User',
      email: 'profile@example.com',
      password: 'password123',
    });
    profileToken = res.body.token;
  });

  it('PUT /auth/profile — updates name', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${profileToken}`)
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Updated Name');
  });

  it('PUT /auth/profile — updates email', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${profileToken}`)
      .send({ email: 'updated@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('updated@example.com');
  });

  it('PUT /auth/profile — rejects duplicate email', async () => {
    // testUser already registered with test@example.com
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${profileToken}`)
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('PUT /auth/profile — changes password with correct current password', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${profileToken}`)
      .send({ currentPassword: 'password123', password: 'newpass456' });

    expect(res.status).toBe(200);

    // Verify new password works for login
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'updated@example.com',
      password: 'newpass456',
    });
    expect(loginRes.status).toBe(200);
  });

  it('PUT /auth/profile — rejects wrong current password', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${profileToken}`)
      .send({ currentPassword: 'wrongpassword', password: 'newpass789' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('WRONG_PASSWORD');
  });

  it('PUT /auth/profile — rejects new password without currentPassword', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${profileToken}`)
      .send({ password: 'newpass789' });

    expect(res.status).toBe(400);
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
    const res = await request(app).post('/api/habits').send({ name: 'Read', frequency: 'daily' });
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
    const res = await request(app).get('/api/habits').set('Authorization', `Bearer ${token}`);
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
    const res = await request(app).get('/api/habits').set('Authorization', `Bearer ${token}`);
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
    expect(res.body).toHaveProperty('days');
    expect(Array.isArray(res.body.days)).toBe(true);
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

// ─── Analytics — monthly with from/to ─────────────────────────────────

describe('Analytics — monthly with from/to', () => {
  let monthlyToken: string;
  let monthlyHabitId: string;

  beforeAll(async () => {
    await clearDB();
    const auth = await registerAndGetToken();
    monthlyToken = auth.token;

    const habitRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${monthlyToken}`)
      .send({ name: 'Monthly Test Habit', frequency: 'daily' });
    monthlyHabitId = habitRes.body._id;

    // Create some completions in January
    await request(app)
      .post('/api/completions')
      .set('Authorization', `Bearer ${monthlyToken}`)
      .send({ habitId: monthlyHabitId, date: '2026-01-05' });

    await request(app)
      .post('/api/completions')
      .set('Authorization', `Bearer ${monthlyToken}`)
      .send({ habitId: monthlyHabitId, date: '2026-01-15' });

    await request(app)
      .post('/api/completions')
      .set('Authorization', `Bearer ${monthlyToken}`)
      .send({ habitId: monthlyHabitId, date: '2026-01-25' });
  });

  it('GET /analytics/monthly — supports from/to date range params', async () => {
    const res = await request(app)
      .get('/api/analytics/monthly')
      .set('Authorization', `Bearer ${monthlyToken}`)
      .query({ from: '2026-01-01', to: '2026-01-30' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('days');
    expect(Array.isArray(res.body.days)).toBe(true);
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
    const unread = (check.body as Array<{ isRead: boolean }>).filter((n) => !n.isRead);
    expect(unread.length).toBe(0);
  });
});

// ─── Notification triggers ──────────────────────────────────────────

describe('Notification triggers', () => {
  let triggerToken: string;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Trigger User',
      email: 'trigger@example.com',
      password: 'password123',
    });
    triggerToken = res.body.token;
  });

  it('POST /habits — creates first-habit notification on first habit', async () => {
    await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${triggerToken}`)
      .send({ name: 'Meditate', frequency: 'daily' });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${triggerToken}`);

    expect(res.status).toBe(200);
    const firstHabitNotif = (res.body as Array<{ title: string; type: string }>).find(
      (n) => n.title === "You're on your way",
    );
    expect(firstHabitNotif).toBeDefined();
    expect(firstHabitNotif!.type).toBe('achievement');
  });

  it('POST /habits — does not duplicate first-habit notification on second habit', async () => {
    await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${triggerToken}`)
      .send({ name: 'Read', frequency: 'daily' });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${triggerToken}`);

    const notifs = (res.body as Array<{ title: string }>).filter(
      (n) => n.title === "You're on your way",
    );
    expect(notifs.length).toBe(1);
  });

  it('POST /completions — creates first-completion notification', async () => {
    // triggerToken already has 2 habits from above; get the first habit id
    const habitsRes = await request(app)
      .get('/api/habits')
      .set('Authorization', `Bearer ${triggerToken}`);
    const firstHabitId = (habitsRes.body as Array<{ _id: string }>)[0]!._id;

    await request(app)
      .post('/api/completions')
      .set('Authorization', `Bearer ${triggerToken}`)
      .send({ habitId: firstHabitId, date: '2026-01-01' });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${triggerToken}`);

    const notif = (res.body as Array<{ title: string; type: string }>).find(
      (n) => n.title === 'First check-in',
    );
    expect(notif).toBeDefined();
    expect(notif!.type).toBe('achievement');
  });

  it('POST /completions — creates streak notification at 3-day milestone', async () => {
    // Use a fresh user with exactly 1 daily habit so calculateStreak(completions, 1) fires correctly.
    const streakUserRes = await request(app).post('/api/auth/register').send({
      name: 'Streak User',
      email: 'streak@example.com',
      password: 'password123',
    });
    const streakToken = streakUserRes.body.token as string;

    const habitRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${streakToken}`)
      .send({ name: 'Run', frequency: 'daily' });
    const localHabitId = habitRes.body._id as string;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dates = [-2, -1, 0].map((offset) => {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() + offset);
      return d.toISOString().split('T')[0];
    });

    for (const date of dates) {
      await request(app)
        .post('/api/completions')
        .set('Authorization', `Bearer ${streakToken}`)
        .send({ habitId: localHabitId, date });
    }

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${streakToken}`);

    const streakNotif = (res.body as Array<{ title: string; type: string }>).find(
      (n) => n.title === '🔥 3-day streak',
    );
    expect(streakNotif).toBeDefined();
    expect(streakNotif!.type).toBe('streak');
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

// ─── WeeklyPlan ─────────────────────────────────────────────────────

describe('WeeklyPlan endpoints', () => {
  let wpToken: string;

  beforeAll(async () => {
    const result = await registerAndGetToken({
      name: 'WP User',
      email: 'wp@example.com',
      password: 'password123',
    });
    wpToken = result.token;
  });

  it('GET /weekly-plans/:weekKey — 404 when no plan exists', async () => {
    const res = await request(app)
      .get('/api/weekly-plans/2026-03-28')
      .set('Authorization', `Bearer ${wpToken}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('PUT /weekly-plans/:weekKey — creates a plan', async () => {
    const res = await request(app)
      .put('/api/weekly-plans/2026-03-28')
      .set('Authorization', `Bearer ${wpToken}`)
      .send({ habitTargetOverrides: [], weekNote: 'Hip flexor week' });
    expect(res.status).toBe(200);
    expect(res.body.weekKey).toBe('2026-03-28');
    expect(res.body.weekNote).toBe('Hip flexor week');
    expect(res.body.habitTargetOverrides).toEqual([]);
  });

  it('GET /weekly-plans/:weekKey — returns existing plan', async () => {
    const res = await request(app)
      .get('/api/weekly-plans/2026-03-28')
      .set('Authorization', `Bearer ${wpToken}`);
    expect(res.status).toBe(200);
    expect(res.body.weekNote).toBe('Hip flexor week');
  });

  it('PUT /weekly-plans/:weekKey — updates plan (upsert)', async () => {
    const res = await request(app)
      .put('/api/weekly-plans/2026-03-28')
      .set('Authorization', `Bearer ${wpToken}`)
      .send({ habitTargetOverrides: [], weekNote: 'Updated note' });
    expect(res.status).toBe(200);
    expect(res.body.weekNote).toBe('Updated note');
  });

  it('GET /weekly-plans/:weekKey — 401 without token', async () => {
    const res = await request(app).get('/api/weekly-plans/2026-03-28');
    expect(res.status).toBe(401);
  });
});

// ─── MonthlyGoalItem ─────────────────────────────────────────────────

describe('MonthlyGoalItem endpoints', () => {
  let mgToken: string;

  beforeAll(async () => {
    const result = await registerAndGetToken({
      name: 'MG User',
      email: 'mg@example.com',
      password: 'password123',
    });
    mgToken = result.token;
  });

  const fakeHabitId = '507f1f77bcf86cd799439011';

  it('GET /monthly-goals/:monthKey — returns empty array when none exist', async () => {
    const res = await request(app)
      .get('/api/monthly-goals/2026-03')
      .set('Authorization', `Bearer ${mgToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('PUT /monthly-goals/:monthKey/:habitId — creates goal items', async () => {
    const items = [
      { text: 'Push-ups 3x20', completed: false, order: 0 },
      { text: 'Bulgarian split squat 3x10', completed: false, order: 1 },
    ];
    const res = await request(app)
      .put(`/api/monthly-goals/2026-03/${fakeHabitId}`)
      .set('Authorization', `Bearer ${mgToken}`)
      .send({ items });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.items[0].text).toBe('Push-ups 3x20');
    expect(res.body.monthKey).toBe('2026-03');
  });

  it('GET /monthly-goals/:monthKey — returns created goals', async () => {
    const res = await request(app)
      .get('/api/monthly-goals/2026-03')
      .set('Authorization', `Bearer ${mgToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].items).toHaveLength(2);
  });

  it('PUT /monthly-goals/:monthKey/:habitId — upserts (replaces items)', async () => {
    const items = [{ text: 'Push-ups 3x20', completed: true, order: 0 }];
    const res = await request(app)
      .put(`/api/monthly-goals/2026-03/${fakeHabitId}`)
      .set('Authorization', `Bearer ${mgToken}`)
      .send({ items });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].completed).toBe(true);
  });

  it('GET /monthly-goals/:monthKey — 401 without token', async () => {
    const res = await request(app).get('/api/monthly-goals/2026-03');
    expect(res.status).toBe(401);
  });
});
