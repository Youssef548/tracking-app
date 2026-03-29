/**
 * Week utilities for the Sat-start weekly planner.
 * Week key format: "YYYY-MM-DD" (the Saturday that starts the week).
 */

/** Returns the Saturday date string (YYYY-MM-DD) for the week containing `date`. */
export function getWeekKey(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysSinceSat = day === 6 ? 0 : day + 1;
  d.setDate(d.getDate() - daysSinceSat);
  return toDateString(d);
}

/** Returns the week key for today. */
export function getCurrentWeekKey(): string {
  return getWeekKey(new Date());
}

/** Returns an array of 7 dates: [Sat, Sun, Mon, Tue, Wed, Thu, Fri]. */
export function getWeekDays(weekKey: string): [Date, Date, Date, Date, Date, Date, Date] {
  const sat = new Date(weekKey + 'T00:00:00');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sat);
    d.setDate(sat.getDate() + i);
    return d;
  }) as [Date, Date, Date, Date, Date, Date, Date];
}

/** "Mar 24" label for the Saturday that starts the week. */
export function formatWeekLabel(weekKey: string): string {
  const sat = new Date(weekKey + 'T00:00:00');
  return sat.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** "YYYY-MM" for month key. */
export function getMonthKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** "March 2026" label from monthKey "2026-03". */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-') as [string, string];
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Week key for the previous week. */
export function prevWeekKey(weekKey: string): string {
  const d = new Date(weekKey + 'T00:00:00');
  d.setDate(d.getDate() - 7);
  return toDateString(d);
}

/** Week key for the next week. */
export function nextWeekKey(weekKey: string): string {
  const d = new Date(weekKey + 'T00:00:00');
  d.setDate(d.getDate() + 7);
  return toDateString(d);
}

/** Previous month key: "2026-03" → "2026-02". */
export function prevMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-') as [string, string];
  const d = new Date(Number(year), Number(month) - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Next month key: "2026-03" → "2026-04". */
export function nextMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-') as [string, string];
  const d = new Date(Number(year), Number(month), 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Format a Date as "YYYY-MM-DD". */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Short day label for column headers. */
export const DAY_LABELS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;
