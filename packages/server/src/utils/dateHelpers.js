function normalizeDate(dateInput) {
  const d = new Date(dateInput);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - dayOfWeek);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end };
}

function getMonthRange(month, year) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

module.exports = { normalizeDate, getWeekRange, getMonthRange };
