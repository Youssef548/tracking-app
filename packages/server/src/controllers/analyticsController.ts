import { Request, Response, NextFunction } from 'express';
import Completion from '../models/Completion';
import Habit from '../models/Habit';
import { getWeekRange, getMonthRange, normalizeDate } from '../utils/dateHelpers';
import { calculateStreak } from '../utils/streakCalculator';
import type { CompletionDocument } from '../models/Completion';
import type { HabitDocument } from '../models/Habit';

type DayEntry = { completed: boolean; value: number; isFuture: boolean };
type DayMap = Record<string, DayEntry>;

export async function getWeeklyAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { start, end } = getWeekRange();

    const habits = await Habit.find({ userId, isActive: true });
    const completions = await Completion.find({ userId, date: { $gte: start, $lt: end } });

    let totalTarget = 0;
    for (const h of habits) {
      if (h.frequency === 'daily') {
        const created = normalizeDate(h.createdAt);
        const effectiveStart = created > start ? created : start;
        const daysActive = Math.max(0, Math.ceil((end.getTime() - effectiveStart.getTime()) / 86400000));
        totalTarget += Math.min(daysActive, 7);
      } else {
        totalTarget += h.target;
      }
    }

    const completedCount = completions.length;
    const score = totalTarget > 0 ? Math.round((completedCount / totalTarget) * 100) : 0;

    const dailyHabits = habits.filter((h) => h.frequency === 'daily');
    const streakCutoff = new Date();
    streakCutoff.setUTCDate(streakCutoff.getUTCDate() - 365);
    streakCutoff.setUTCHours(0, 0, 0, 0);
    const allCompletions = await Completion.find({ userId, date: { $gte: streakCutoff } }).sort({ date: -1 });
    const streak = calculateStreak(allCompletions as CompletionDocument[], dailyHabits.length);

    const dayData: { date: string; count: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const dayKey = d.toISOString().split('T')[0] ?? '';
      const dayCompletions = completions.filter(
        (c) => normalizeDate(c.date).toISOString().split('T')[0] === dayKey,
      );
      dayData.push({ date: dayKey, count: dayCompletions.length });
    }

    res.json({ score, completedCount, targetCount: totalTarget, streak, dayData });
  } catch (err) {
    next(err);
  }
}

export async function getMonthlyAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    let start: Date;
    let end: Date;

    if (req.query['from'] && req.query['to']) {
      start = normalizeDate(req.query['from'] as string);
      end = normalizeDate(req.query['to'] as string);
      end.setUTCDate(end.getUTCDate() + 1); // inclusive end
    } else {
      const month = parseInt(req.query['month'] as string) || new Date().getMonth() + 1;
      const year = parseInt(req.query['year'] as string) || new Date().getFullYear();
      ({ start, end } = getMonthRange(month, year));
    }

    const completions = await Completion.find({ userId, date: { $gte: start, $lt: end } }).populate(
      'habitId',
      'name icon color',
    );

    const daysMap: Record<string, unknown[]> = {};
    for (const c of completions) {
      const key = normalizeDate(c.date).toISOString().split('T')[0] ?? '';
      if (!daysMap[key]) daysMap[key] = [];
      daysMap[key]!.push(c);
    }

    const days = Object.entries(daysMap).map(([date, comps]) => ({ date, completions: comps }));
    res.json({ days });
  } catch (err) {
    next(err);
  }
}

export async function getHabitAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const habit = await Habit.findOne({ _id: req.params['id'], userId });
    if (!habit) {
      res.status(404).json({ error: { message: 'Habit not found', code: 'NOT_FOUND' } });
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

    const recentCompletions = await Completion.find({
      habitId: habit._id,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: -1 });

    const habitCreated = normalizeDate(habit.createdAt);
    const effectiveStart = habitCreated > thirtyDaysAgo ? habitCreated : thirtyDaysAgo;
    const nowMidnight = new Date();
    nowMidnight.setUTCHours(0, 0, 0, 0);
    const daysSinceCreation = Math.max(
      1,
      Math.ceil((nowMidnight.getTime() - effectiveStart.getTime()) / 86400000) + 1,
    );

    let expectedDays: number;
    if (habit.frequency === 'daily') {
      expectedDays = Math.min(daysSinceCreation, 30);
    } else {
      const weeksActive = daysSinceCreation / 7;
      expectedDays = Math.round(weeksActive * habit.target);
    }

    const completionRate = expectedDays > 0 ? Math.round((recentCompletions.length / expectedDays) * 100) : 0;

    let streakDays = 0;
    if (habit.frequency === 'daily') {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const current = new Date(today);
      const dateSet = new Set(
        recentCompletions.map((c) => normalizeDate(c.date).toISOString().split('T')[0] ?? ''),
      );
      while (dateSet.has(current.toISOString().split('T')[0] ?? '')) {
        streakDays++;
        current.setUTCDate(current.getUTCDate() - 1);
      }
    }

    res.json({ completionRate, recentCompletions: recentCompletions.slice(0, 10), streakDays });
  } catch (err) {
    next(err);
  }
}

export async function weeklyConsistency(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const weekParam = req.query['week'];

    let weekStart: Date;
    if (weekParam) {
      weekStart = normalizeDate(weekParam as string);
    } else {
      const now = new Date();
      const day = now.getUTCDay();
      const diff = day === 0 ? 6 : day - 1;
      weekStart = new Date(now);
      weekStart.setUTCDate(now.getUTCDate() - diff);
      weekStart.setUTCHours(0, 0, 0, 0);
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

    const habits = (await Habit.find({ userId, isActive: true }).populate(
      'categoryId',
      'name color',
    )) as HabitDocument[];
    const completions = await Completion.find({
      userId,
      date: { $gte: weekStart, $lt: weekEnd },
    });

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
    const today = normalizeDate(new Date());

    // Pre-index completions by habitId+date for O(1) lookup
    const completionMap = new Map<string, (typeof completions)[0]>();
    for (const c of completions) {
      const key = `${c.habitId.toString()}_${normalizeDate(c.date).toISOString().split('T')[0] ?? ''}`;
      completionMap.set(key, c);
    }

    type HabitRow = {
      habitId: unknown;
      name: string;
      icon: string;
      trackingType: string;
      category: { name: string; color: string } | null;
      days: DayMap;
      weeklyTarget?: number | null;
      totalHours?: number;
      rate: number;
    };

    const habitRows: HabitRow[] = habits.map((habit) => {
      const days: DayMap = {};
      let completedDays = 0;
      let totalHours = 0;
      const habitCreated = normalizeDate(habit.createdAt);

      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setUTCDate(weekStart.getUTCDate() + i);
        const dateStr = d.toISOString().split('T')[0] ?? '';
        const dayName = dayNames[i] ?? 'Mon';

        const isFuture = d > today;
        const isBeforeCreation = d < habitCreated;

        if (isFuture || isBeforeCreation) {
          days[dayName] = { completed: false, value: 0, isFuture: true };
          continue;
        }

        const completion = completionMap.get(`${habit._id.toString()}_${dateStr}`);

        if (completion) {
          days[dayName] = { completed: true, value: completion.value, isFuture: false };
          if (habit.trackingType === 'duration') {
            totalHours += completion.value;
          }
          completedDays++;
        } else {
          days[dayName] = { completed: false, value: 0, isFuture: false };
        }
      }

      // Handle populated categoryId
      const catId = habit.categoryId as unknown as { name: string; color: string } | null;
      const row: HabitRow = {
        habitId: habit._id,
        name: habit.name,
        icon: habit.icon,
        trackingType: habit.trackingType ?? 'checkmark',
        category: catId && typeof catId === 'object' && 'name' in catId
          ? { name: catId.name, color: catId.color }
          : null,
        days,
        rate: 0,
      };

      if (habit.trackingType === 'duration') {
        row.weeklyTarget = habit.weeklyTarget;
        row.totalHours = totalHours;
        row.rate = (habit.weeklyTarget ?? 0) > 0 ? Math.min(totalHours / (habit.weeklyTarget ?? 1), 1) : 0;
      } else {
        const activeDays = Object.values(days).filter((d) => !d.isFuture).length;
        row.rate = activeDays > 0 ? completedDays / activeDays : 0;
      }

      return row;
    });

    const dailyScores: Record<string, number | null> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setUTCDate(weekStart.getUTCDate() + i);
      const dayName = dayNames[i] ?? 'Mon';
      const isFuture = d > today;

      if (isFuture) {
        dailyScores[dayName] = null;
        continue;
      }

      let completed = 0;
      let activeHabits = 0;
      for (const habit of habitRows) {
        const dayEntry = habit.days[dayName];
        if (dayEntry && !dayEntry.isFuture) {
          activeHabits++;
          if (dayEntry.completed) completed++;
        }
      }
      dailyScores[dayName] = activeHabits > 0 ? completed / activeHabits : null;
    }

    const activeDailyScores = Object.values(dailyScores).filter((s): s is number => s !== null);
    const overallScore =
      activeDailyScores.length > 0
        ? activeDailyScores.reduce((a, b) => a + b, 0) / activeDailyScores.length
        : 0;

    res.json({
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: new Date(weekEnd.getTime() - 86400000).toISOString().split('T')[0],
      habits: habitRows,
      dailyScores,
      overallScore: Math.round(overallScore * 100) / 100,
    });
  } catch (err) {
    next(err);
  }
}
