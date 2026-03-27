import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';

import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import habitsRoutes from './routes/habits';
import completionsRoutes from './routes/completions';
import analyticsRoutes from './routes/analytics';
import notificationsRoutes from './routes/notifications';
import categoriesRoutes from './routes/categories';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/completions', completionsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/categories', categoriesRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

const PORT = process.env['PORT'] ?? 5000;
const MONGO_URI = process.env['MONGO_URI'] ?? 'mongodb://localhost:27017/mindful-flow';

if (process.env['NODE_ENV'] !== 'test') {
  mongoose
    .connect(MONGO_URI as string)
    .then(() => {
      console.log('Connected to MongoDB');
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err: Error) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

export default app;
