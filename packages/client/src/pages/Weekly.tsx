import { useState, useMemo } from 'react';
import { useWeeklyConsistency } from '../hooks/useWeeklyConsistency';
import type { WeeklyConsistency } from '../hooks/useWeeklyConsistency';
import { useCategories } from '../hooks/useCategories';

function getMonday(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0] ?? '';
}

function shiftWeek(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + delta * 7);
  return d.toISOString().split('T')[0] ?? '';
}

function formatWeekRange(startStr: string): string {
  const start = new Date(startStr + 'T00:00:00Z');
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const s = start.toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
  const e = end.toLocaleDateString('en-US', { ...opts, year: 'numeric', timeZone: 'UTC' });
  return `${s} – ${e}`;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function contrastText(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#000' : '#fff';
}

interface DayDisciplineLabelProps {
  score: number | null;
}

function DayDisciplineLabel({ score }: DayDisciplineLabelProps) {
  if (score === null) return <span className="text-on-surface-variant/40 text-xs">—</span>;
  const pct = Math.round(score * 100);
  let color = 'text-error';
  let label = 'Missed';
  if (pct === 100) { color = 'text-success'; label = 'Perfect'; }
  else if (pct >= 50) { color = 'text-warning'; label = 'Partial'; }
  return (
    <div className="flex flex-col items-center">
      <span className={`text-xs font-bold ${color}`}>{pct}%</span>
      <span className={`text-[9px] ${color}`}>{label}</span>
    </div>
  );
}

interface WeekHistoryCardProps {
  weekStart: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function WeekHistoryCard({ weekStart, label, isActive, onClick }: WeekHistoryCardProps) {
  const { data } = useWeeklyConsistency(weekStart);
  const score = data ? Math.round(data.overallScore * 100) : null;
  let scoreColor = 'text-primary';
  if (score !== null) {
    if (score >= 80) scoreColor = 'text-success';
    else if (score >= 50) scoreColor = 'text-warning';
    else scoreColor = 'text-error';
  }

  return (
    <button
      onClick={onClick}
      className={`bg-surface-container-lowest p-4 rounded-xl text-left transition-all hover:shadow-sm w-full ${
        isActive ? 'border-2 border-primary' : 'border border-outline-variant/10'
      }`}
    >
      <div className="text-xs text-on-surface-variant">{label}</div>
      <div className="text-xs text-on-surface-variant">{formatWeekRange(weekStart)}</div>
      <div className={`text-2xl font-extrabold ${scoreColor} my-1`}>
        {score !== null ? `${score}%` : '—'}
      </div>
      {data && (
        <div className="flex gap-0.5">
          {DAY_NAMES.map((day) => {
            const s = data.dailyScores[day];
            let bg = 'bg-surface-container';
            if (s === null || s === undefined) bg = 'bg-surface-container';
            else if (s === 1) bg = 'bg-success';
            else if (s >= 0.5) bg = 'bg-warning';
            else if (s > 0) bg = 'bg-warning';
            else bg = 'bg-error';
            return <div key={day} className={`flex-1 h-1 rounded-full ${bg}`} />;
          })}
        </div>
      )}
    </button>
  );
}

export default function Weekly() {
  const [weekStart, setWeekStart] = useState<string>(() => getMonday());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data, isLoading } = useWeeklyConsistency(weekStart);
  const { data: categories = [] } = useCategories();

  const currentMonday = getMonday();

  const filteredHabits = useMemo(() => {
    if (!data) return [];
    if (!selectedCategory) return data.habits;
    return data.habits.filter((h) => h.category && h.category.name === selectedCategory);
  }, [data, selectedCategory]);

  const overallPct = data ? Math.round(data.overallScore * 100) : 0;

  const weekHistoryStarts = useMemo(() => {
    return [0, -1, -2, -3].map((offset) => shiftWeek(currentMonday, offset));
  }, [currentMonday]);

  const weekLabels = ['This Week', 'Last Week', '2 Weeks Ago', '3 Weeks Ago'];

  return (
    <>
      <section className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-3">Weekly Tracking</h1>
        <p className="text-on-surface-variant text-lg">Habit-by-habit breakdown of your week.</p>
      </section>

      {/* Week navigation + score */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekStart((w) => shiftWeek(w, -1))}
            aria-label="Previous week"
            className="w-11 h-11 rounded-lg bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-lg" aria-hidden="true">chevron_left</span>
          </button>
          <span className="font-bold text-lg font-headline">{formatWeekRange(weekStart)}</span>
          <button onClick={() => setWeekStart((w) => shiftWeek(w, 1))}
            aria-label="Next week"
            className="w-11 h-11 rounded-lg bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-lg" aria-hidden="true">chevron_right</span>
          </button>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold font-headline text-on-surface">{overallPct}%</span>
          <span className="text-sm font-medium text-on-surface-variant">weekly discipline</span>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          aria-pressed={!selectedCategory}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
            !selectedCategory ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
            aria-pressed={selectedCategory === cat.name}
            className="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors border"
            style={{
              borderColor: cat.color,
              backgroundColor: selectedCategory === cat.name ? cat.color : 'transparent',
              color: selectedCategory === cat.name ? contrastText(cat.color) : cat.color,
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Consistency Table */}
      {!isLoading && data && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-x-auto mb-8">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="bg-surface-container">
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider w-40 border-r border-outline-variant/10">Habit</th>
                {DAY_NAMES.map((day) => (
                  <th key={day} className="text-center px-2 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider border-r border-outline-variant/10">{day}</th>
                ))}
                <th className="text-center px-3 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Rate</th>
              </tr>
            </thead>
            <tbody>
              {filteredHabits.map((habit) => (
                <tr key={habit.habitId} className="border-t border-outline-variant/5 hover:bg-surface-container/30 transition-colors">
                  <td className="px-4 py-3 border-r border-outline-variant/10">
                    <div className="font-semibold text-sm">{habit.name}</div>
                    {habit.category && (
                      <span
                        className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1"
                        style={{ backgroundColor: `${habit.category.color}15`, color: habit.category.color }}
                      >
                        {habit.category.name}
                      </span>
                    )}
                  </td>
                  {DAY_NAMES.map((day) => {
                    const cell = habit.days[day];
                    if (!cell) return <td key={day} className="text-center px-2 py-3 border-r border-outline-variant/10"><span className="text-on-surface-variant/30">—</span></td>;
                    return (
                      <td key={day} className="text-center px-2 py-3 border-r border-outline-variant/10">
                        {cell.isFuture ? (
                          <span className="text-on-surface-variant/30">—</span>
                        ) : habit.trackingType === 'duration' ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-sm font-bold ${
                              cell.value === 0 ? 'text-error' : cell.value >= (habit.weeklyTarget ?? 0) / 7 ? 'text-success' : 'text-warning'
                            }`}>
                              {cell.value > 0 ? `${cell.value}h` : '0'}
                            </span>
                            <div className="w-4/5 h-1 bg-surface-container rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min((cell.value / ((habit.weeklyTarget ?? 5) / 5)) * 100, 100)}%`,
                                  backgroundColor: habit.category?.color ?? 'rgb(var(--color-primary))',
                                }}
                              />
                            </div>
                          </div>
                        ) : cell.completed ? (
                          <span className="text-success text-base font-bold">✓</span>
                        ) : (
                          <span className="text-error text-base font-bold">✗</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center px-3 py-3">
                    {habit.trackingType === 'duration' ? (
                      <span className={`text-sm font-bold ${habit.rate >= 1 ? 'text-success' : habit.rate >= 0.5 ? 'text-warning' : 'text-error'}`}>
                        {habit.totalHours}/{habit.weeklyTarget ?? 0}h
                      </span>
                    ) : (
                      <span className={`text-sm font-bold ${habit.rate >= 0.8 ? 'text-success' : habit.rate >= 0.5 ? 'text-warning' : 'text-error'}`}>
                        {Math.round(habit.rate * 100)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-outline-variant/20 bg-surface-container/50">
                <td className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase border-r border-outline-variant/10">Day Discipline</td>
                {DAY_NAMES.map((day) => (
                  <td key={day} className="text-center px-2 py-3 border-r border-outline-variant/10">
                    <DayDisciplineLabel score={data.dailyScores[day] ?? null} />
                  </td>
                ))}
                <td className="text-center px-3 py-3">
                  <span className="text-base font-extrabold text-primary">{overallPct}%</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {isLoading && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-8 mb-8 animate-pulse">
          <div className="skeleton w-full h-64 rounded-lg" />
        </div>
      )}

      {/* Week History */}
      <div className="mb-8">
        <h2 className="font-headline text-xl font-bold mb-4">Week History</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {weekHistoryStarts.map((ws, i) => (
            <WeekHistoryCard
              key={ws}
              weekStart={ws}
              label={weekLabels[i] ?? ''}
              isActive={weekStart === ws}
              onClick={() => setWeekStart(ws)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
