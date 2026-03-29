import type { Frequency, Color, TrackingType, NotificationType } from './constants';

export type { Frequency, Color, TrackingType, NotificationType };

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
}

export interface HabitCategory {
  _id: string;
  name: string;
  color: string;
}

export interface Habit {
  _id: string;
  userId: string;
  name: string;
  icon: string;
  color: Color;
  frequency: Frequency;
  target: number;
  description: string;
  categoryId: HabitCategory | null;
  trackingType: TrackingType;
  weeklyTarget: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompletionHabit {
  _id: string;
  name: string;
  icon: string;
  color: Color;
  frequency: Frequency;
}

export interface Completion {
  _id: string;
  habitId: CompletionHabit;
  userId: string;
  date: string;
  value: number;
  note: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHabitInput {
  name: string;
  frequency: Frequency;
  icon?: string;
  color?: Color;
  target?: number;
  description?: string;
  categoryId?: string | null;
  trackingType?: TrackingType;
  weeklyTarget?: number | null;
}

export interface CreateCompletionInput {
  habitId: string;
  date: string;
  value?: number;
  note?: string;
}

export interface CreateCategoryInput {
  name: string;
  color: string;
}

export interface WeeklyPlanHabitOverride {
  habitId: string;
  targetDays: number;
}

export interface WeeklyPlan {
  _id: string;
  userId: string;
  weekKey: string; // "2026-03-28" — Saturday date that starts the week
  habitTargetOverrides: WeeklyPlanHabitOverride[];
  weekNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalItem {
  _id: string;
  text: string;
  completed: boolean;
  order: number;
}

export interface MonthlyGoalItem {
  _id: string;
  userId: string;
  habitId: string;
  monthKey: string; // "2026-03"
  items: GoalItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TotalsEntry {
  habitId: string;
  habitName: string;
  done: number;
  target: number;
}

export interface WeeklyReview {
  _id: string;
  userId: string;
  weekKey: string; // "2026-03-28"
  wentWell: string;
  toImprove: string;
  changesNextWeek: string;
  totals: TotalsEntry[];
  createdAt: string;
  updatedAt: string;
}
