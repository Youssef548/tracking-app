import { FREQUENCIES, COLORS, TRACKING_TYPES } from './constants';
import type { Frequency, Color, TrackingType } from './constants';

export interface ValidationResult<E extends Record<string, string> = Record<string, string>> {
  isValid: boolean;
  errors: Partial<E>;
}

interface AuthErrors extends Record<string, string> { name: string; email: string; password: string; }
interface HabitErrors extends Record<string, string> { name: string; frequency: string; target: string; color: string; trackingType: string; weeklyTarget: string; }
interface CompletionErrors extends Record<string, string> { habitId: string; date: string; value: string; }
interface CategoryErrors extends Record<string, string> { name: string; color: string; }

export function validateAuthInput(
  data: Partial<{ name: string; email: string; password: string }>,
  isLogin = false,
): ValidationResult<AuthErrors> {
  const errors: Partial<AuthErrors> = {};
  if (!isLogin && (!data.name || data.name.trim().length === 0)) errors.name = 'Name is required';
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Valid email is required';
  if (!data.password || data.password.length < 6) errors.password = 'Password must be at least 6 characters';
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateHabitInput(
  data: Partial<{ name: string; frequency: Frequency; target: number; color: Color; trackingType: TrackingType; weeklyTarget: number }>,
): ValidationResult<HabitErrors> {
  const errors: Partial<HabitErrors> = {};
  if (!data.name || data.name.trim().length === 0) errors.name = 'Habit name is required';
  if (data.name && data.name.length > 100) errors.name = 'Habit name must be under 100 characters';
  if (!data.frequency || !Object.values(FREQUENCIES).includes(data.frequency)) errors.frequency = 'Frequency must be "daily" or "weekly"';
  if (data.frequency === FREQUENCIES.WEEKLY) {
    if (!data.target || data.target < 1 || data.target > 7) errors.target = 'Weekly target must be between 1 and 7';
  }
  if (data.color && !COLORS.includes(data.color)) errors.color = 'Invalid color token';
  if (data.trackingType && !Object.values(TRACKING_TYPES).includes(data.trackingType)) errors.trackingType = 'Tracking type must be "checkmark" or "duration"';
  if (data.trackingType === TRACKING_TYPES.DURATION) {
    if (!data.weeklyTarget || data.weeklyTarget < 1 || data.weeklyTarget > 168) errors.weeklyTarget = 'Weekly target must be between 1 and 168 hours';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateCompletionInput(
  data: Partial<{ habitId: string; date: string; value: number }>,
): ValidationResult<CompletionErrors> {
  const errors: Partial<CompletionErrors> = {};
  if (!data.habitId) errors.habitId = 'Habit ID is required';
  if (!data.date) errors.date = 'Date is required';
  if (data.value !== undefined && (typeof data.value !== 'number' || data.value < 0)) errors.value = 'Value must be a non-negative number';
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateCategoryInput(
  data: Partial<{ name: string; color: string }>,
): ValidationResult<CategoryErrors> {
  const errors: Partial<CategoryErrors> = {};
  if (!data.name || data.name.trim().length === 0) errors.name = 'Category name is required';
  if (data.name && data.name.length > 50) errors.name = 'Category name must be under 50 characters';
  if (!data.color || !/^#[0-9a-fA-F]{6}$/.test(data.color)) errors.color = 'Valid hex color is required';
  return { isValid: Object.keys(errors).length === 0, errors };
}
