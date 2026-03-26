const { normalizeDate } = require('./dateHelpers');

function calculateStreak(completions, dailyHabitCount) {
  if (dailyHabitCount === 0) return 0;

  const completionsByDate = {};
  for (const c of completions) {
    const key = normalizeDate(c.date).toISOString().split('T')[0];
    completionsByDate[key] = (completionsByDate[key] || 0) + 1;
  }

  let streak = 0;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const current = new Date(today);

  while (true) {
    const key = current.toISOString().split('T')[0];
    const count = completionsByDate[key] || 0;
    if (count >= dailyHabitCount) {
      streak++;
      current.setUTCDate(current.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

module.exports = { calculateStreak };
