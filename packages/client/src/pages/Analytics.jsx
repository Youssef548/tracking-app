import { lazy, Suspense, useState } from 'react';
import { useWeeklyAnalytics, useMonthlyAnalytics, useLast30DaysAnalytics } from '../hooks/useAnalytics';
import { useHabits } from '../hooks/useHabits';
import { useWeeklyConsistency } from '../hooks/useWeeklyConsistency';
import AnimatedList, { AnimatedItem } from '../components/AnimatedList';

const LazyTrendChart = lazy(() =>
  import('../components/ChartBlock').then((m) => ({ default: m.TrendChart }))
);
const LazyComparisonBar = lazy(() =>
  import('../components/ChartBlock').then((m) => ({ default: m.ComparisonBar }))
);

function TrendChart(props) {
  return <Suspense fallback={<div className="skeleton h-[200px] rounded-2xl" />}><LazyTrendChart {...props} /></Suspense>;
}
function ComparisonBar(props) {
  return <Suspense fallback={<div className="skeleton h-8 rounded-xl" />}><LazyComparisonBar {...props} /></Suspense>;
}

const VIEWS = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: '30days', label: '30 Days' },
];

function derivePeriodStats(days, habits) {
  if (!days || !habits) return { score: 0, completedCount: 0, targetCount: 0 };
  const totalDays = days.length || 1;
  const completedCount = days.reduce((sum, d) => sum + d.completions.length, 0);
  let targetCount = 0;
  for (const h of habits) {
    if (h.frequency === 'daily') targetCount += totalDays;
    else targetCount += Math.round((totalDays / 7) * h.target);
  }
  const score = targetCount > 0 ? Math.round((completedCount / targetCount) * 100) : 0;
  return { score, completedCount, targetCount };
}

function PeriodHeatmap({ days }) {
  if (!days || days.length === 0) {
    return <p className="text-on-surface-variant text-sm">No data for this period.</p>;
  }

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const maxCount = Math.max(...sorted.map((d) => d.completions.length), 1);

  return (
    <div className="flex flex-wrap gap-1.5">
      {sorted.map((d) => {
        const count = d.completions.length;
        const intensity = count === 0 ? 0 : Math.min(count / maxCount, 1);
        const label = new Date(d.date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
        return (
          <div
            key={d.date}
            title={`${label}: ${count} completion${count !== 1 ? 's' : ''}`}
            className="w-5 h-5 rounded-sm"
            style={{
              backgroundColor: count === 0
                ? 'var(--color-surface-container, #eaeff2)'
                : `rgba(0, 91, 196, ${0.2 + intensity * 0.8})`,
            }}
          />
        );
      })}
    </div>
  );
}

function HabitBreakdown({ habits, consistency }) {
  const habitRates = new Map((consistency?.habits || []).map((h) => [h.habitId, Math.round(h.rate * 100)]));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {habits.map((habit) => {
        const colorClass = habit.color === 'secondary' ? 'bg-secondary' : habit.color === 'tertiary' ? 'bg-tertiary' : 'bg-primary';
        const iconBg = habit.color === 'secondary' ? 'bg-secondary/10 text-secondary' : habit.color === 'tertiary' ? 'bg-tertiary/10 text-tertiary' : 'bg-primary/10 text-primary';
        const rate = habitRates.get(habit._id) || 0;
        return (
          <div key={habit._id} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/5 hover:shadow-xl transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
                <span className="material-symbols-outlined text-xl">{habit.icon}</span>
              </div>
              <span className={`text-lg font-extrabold ${rate >= 80 ? 'text-success' : rate >= 50 ? 'text-warning' : 'text-error'}`}>
                {rate}%
              </span>
            </div>
            <h4 className="font-semibold text-on-surface mb-1">{habit.name}</h4>
            <p className="text-xs text-on-surface-variant mb-4">{habit.description || habit.frequency}</p>
            <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
              <div className={`${colorClass} h-full rounded-full`} style={{ width: `${rate}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics() {
  const [view, setView] = useState('week');

  const { data: weekly } = useWeeklyAnalytics();
  const { data: habits = [] } = useHabits();
  const { data: consistency } = useWeeklyConsistency();

  const now = new Date();
  const { data: monthly } = useMonthlyAnalytics(now.getMonth() + 1, now.getFullYear());
  const { data: last30 } = useLast30DaysAnalytics();

  const periodData = view === 'month' ? monthly : view === '30days' ? last30 : null;
  const periodStats = derivePeriodStats(periodData?.days, habits);

  const weekBarData = [
    { label: 'THIS WEEK', completed: weekly?.completedCount || 0, target: weekly?.targetCount || 0 },
  ];
  const periodBarData = [
    { label: view === 'month' ? 'THIS MONTH' : 'LAST 30 DAYS', completed: periodStats.completedCount, target: periodStats.targetCount },
  ];

  return (
    <>
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline font-extrabold text-3xl md:text-4xl tracking-tight text-on-surface mb-2">Performance</h1>
          <p className="text-on-surface-variant text-lg">
            {view === 'week' ? 'Score, trends, and per-habit rates for this week.' : view === 'month' ? 'Your performance this calendar month.' : 'Your performance over the last 30 days.'}
          </p>
        </div>
        <div className="flex gap-1 bg-surface-container rounded-xl p-1 self-start md:self-auto">
          {VIEWS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              aria-pressed={view === key}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                view === key
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'week' && (
        <AnimatedList className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          <AnimatedItem className="md:col-span-4">
            <div className="bg-surface-container-lowest p-8 rounded-3xl flex flex-col justify-between h-full">
              <div>
                <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary-container/10 px-3 py-1 rounded-full">Current Status</span>
                <div className="mt-8">
                  <h2 className="font-headline text-5xl font-extrabold text-on-surface leading-none">{weekly?.score || 0}%</h2>
                  <p className="text-on-surface-variant font-medium mt-2">Weekly Score</p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">% of weekly targets completed</p>
                </div>
              </div>
              <div className="mt-12">
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${weekly?.score || 0}%` }} />
                </div>
              </div>
            </div>
          </AnimatedItem>

          <AnimatedItem className="md:col-span-8">
            <div className="bg-surface-container-lowest p-8 rounded-3xl h-full">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-headline font-bold text-xl">Consistency Trend</h3>
              </div>
              <TrendChart data={weekly?.dayData || []} />
            </div>
          </AnimatedItem>

          <AnimatedItem className="md:col-span-7">
            <div className="bg-surface-container-lowest p-8 rounded-3xl h-full">
              <h3 className="font-headline font-bold text-xl mb-8">Completed vs Target</h3>
              <ComparisonBar data={weekBarData} />
            </div>
          </AnimatedItem>

          <AnimatedItem className="md:col-span-5">
            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/5 h-full">
              <span className="text-xs font-bold tracking-widest text-on-surface-variant uppercase mb-4 block">Streak</span>
              <div className="mt-4">
                <h3 className="font-headline text-5xl font-extrabold text-on-surface leading-none">{weekly?.streak || 0}</h3>
                <p className="text-on-surface-variant font-medium mt-2">consecutive days</p>
              </div>
              {weekly?.bestDay && (
                <p className="text-sm text-on-surface-variant mt-6">
                  Strongest day this week: <span className="font-bold text-on-surface">{weekly.bestDay}</span>
                </p>
              )}
            </div>
          </AnimatedItem>

          <AnimatedItem className="md:col-span-12 mt-4">
            <div>
              <h3 className="font-headline font-bold text-xl mb-6">Habit Breakdown</h3>
              <HabitBreakdown habits={habits} consistency={consistency} />
            </div>
          </AnimatedItem>
        </AnimatedList>
      )}

      {(view === 'month' || view === '30days') && (
        <AnimatedList className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          <AnimatedItem className="md:col-span-4">
            <div className="bg-surface-container-lowest p-8 rounded-3xl flex flex-col justify-between h-full">
              <div>
                <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary-container/10 px-3 py-1 rounded-full">Period Score</span>
                <div className="mt-8">
                  <h2 className="font-headline text-5xl font-extrabold text-on-surface leading-none">{periodStats.score}%</h2>
                  <p className="text-on-surface-variant font-medium mt-2">{view === 'month' ? 'This Month' : 'Last 30 Days'}</p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">
                    {periodStats.completedCount} of {periodStats.targetCount} targets hit
                  </p>
                </div>
              </div>
              <div className="mt-12">
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${periodStats.score}%` }} />
                </div>
              </div>
            </div>
          </AnimatedItem>

          <AnimatedItem className="md:col-span-8">
            <div className="bg-surface-container-lowest p-8 rounded-3xl h-full">
              <h3 className="font-headline font-bold text-xl mb-6">Activity Heatmap</h3>
              <PeriodHeatmap days={periodData?.days || []} />
            </div>
          </AnimatedItem>

          <AnimatedItem className="md:col-span-7">
            <div className="bg-surface-container-lowest p-8 rounded-3xl h-full">
              <h3 className="font-headline font-bold text-xl mb-8">Completed vs Target</h3>
              <ComparisonBar data={periodBarData} />
            </div>
          </AnimatedItem>

          <AnimatedItem className="md:col-span-5">
            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/5 h-full">
              <span className="text-xs font-bold tracking-widest text-on-surface-variant uppercase mb-4 block">Streak</span>
              <div className="mt-4">
                <h3 className="font-headline text-5xl font-extrabold text-on-surface leading-none">{weekly?.streak || 0}</h3>
                <p className="text-on-surface-variant font-medium mt-2">consecutive days</p>
              </div>
            </div>
          </AnimatedItem>

          <AnimatedItem className="md:col-span-12 mt-4">
            <div>
              <h3 className="font-headline font-bold text-xl mb-6">Habit Breakdown</h3>
              <HabitBreakdown habits={habits} consistency={consistency} />
            </div>
          </AnimatedItem>
        </AnimatedList>
      )}
    </>
  );
}
