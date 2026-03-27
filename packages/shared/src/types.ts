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
