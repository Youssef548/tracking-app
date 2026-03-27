export const FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
} as const;
export type Frequency = (typeof FREQUENCIES)[keyof typeof FREQUENCIES];

export const COLORS = ['primary', 'secondary', 'tertiary'] as const;
export type Color = (typeof COLORS)[number];

export const NOTIFICATION_TYPES = {
  STREAK: 'streak',
  REMINDER: 'reminder',
  ACHIEVEMENT: 'achievement',
  TIP: 'tip',
} as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const HABIT_ICONS = [
  'self_improvement', 'water_drop', 'menu_book', 'fitness_center',
  'forest', 'edit_note', 'bedtime', 'restaurant', 'code', 'music_note',
] as const;
export type HabitIcon = (typeof HABIT_ICONS)[number];

export const TRACKING_TYPES = {
  CHECKMARK: 'checkmark',
  DURATION: 'duration',
} as const;
export type TrackingType = (typeof TRACKING_TYPES)[keyof typeof TRACKING_TYPES];

export const CATEGORY_COLORS = [
  '#8b5cf6', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
] as const;
