const { FREQUENCIES, COLORS, TRACKING_TYPES } = require('./constants');

function validateHabitInput(data) {
  const errors = {};
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Habit name is required';
  }
  if (data.name && data.name.length > 100) {
    errors.name = 'Habit name must be under 100 characters';
  }
  if (!data.frequency || !Object.values(FREQUENCIES).includes(data.frequency)) {
    errors.frequency = 'Frequency must be "daily" or "weekly"';
  }
  if (data.frequency === FREQUENCIES.WEEKLY) {
    if (!data.target || data.target < 1 || data.target > 7) {
      errors.target = 'Weekly target must be between 1 and 7';
    }
  }
  if (data.color && !COLORS.includes(data.color)) {
    errors.color = 'Invalid color token';
  }
  if (data.trackingType && !Object.values(TRACKING_TYPES).includes(data.trackingType)) {
    errors.trackingType = 'Tracking type must be "checkmark" or "duration"';
  }
  if (data.trackingType === TRACKING_TYPES.DURATION) {
    if (!data.weeklyTarget || data.weeklyTarget < 1 || data.weeklyTarget > 168) {
      errors.weeklyTarget = 'Weekly target must be between 1 and 168 hours';
    }
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

function validateAuthInput(data, isLogin = false) {
  const errors = {};
  if (!isLogin && (!data.name || data.name.trim().length === 0)) {
    errors.name = 'Name is required';
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Valid email is required';
  }
  if (!data.password || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

function validateCompletionInput(data) {
  const errors = {};
  if (!data.habitId) {
    errors.habitId = 'Habit ID is required';
  }
  if (!data.date) {
    errors.date = 'Date is required';
  }
  if (data.value !== undefined && (typeof data.value !== 'number' || data.value < 0)) {
    errors.value = 'Value must be a non-negative number';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

function validateCategoryInput(data) {
  const errors = {};
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Category name is required';
  }
  if (data.name && data.name.length > 50) {
    errors.name = 'Category name must be under 50 characters';
  }
  if (!data.color || !/^#[0-9a-fA-F]{6}$/.test(data.color)) {
    errors.color = 'Valid hex color is required';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

module.exports = { validateHabitInput, validateAuthInput, validateCompletionInput, validateCategoryInput };
