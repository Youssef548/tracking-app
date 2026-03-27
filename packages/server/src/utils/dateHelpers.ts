export function normalizeDate(dateInput: Date | string): Date {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${String(dateInput)}`);
  }
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function getWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday-start
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - diff);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end };
}

export function getMonthRange(month: number, year: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}
