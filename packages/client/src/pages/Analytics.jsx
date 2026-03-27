import { lazy, Suspense } from 'react';
import { useWeeklyAnalytics } from '../hooks/useAnalytics';
import { useHabits } from '../hooks/useHabits';
import { useWeeklyConsistency } from '../hooks/useWeeklyConsistency';
import AnimatedList, { AnimatedItem } from '../components/AnimatedList';

// Lazy-load Recharts so it's excluded from the initial bundle
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

export default function Analytics() {
  const { data: weekly } = useWeeklyAnalytics();
  const { data: habits = [] } = useHabits();
  const { data: consistency } = useWeeklyConsistency();
  const habitRates = new Map((consistency?.habits || []).map(h => [h.habitId, Math.round(h.rate * 100)]));

  const barData = [
    { label: 'THIS WEEK', completed: weekly?.completedCount || 0, target: weekly?.targetCount || 0 },
  ];

  return (
    <>
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline font-extrabold text-3xl md:text-4xl tracking-tight text-on-surface mb-2">Performance</h1>
          <p className="text-on-surface-variant text-lg">
            Score, trends, and per-habit rates for this week.
          </p>
        </div>
      </div>

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
            <ComparisonBar data={barData} />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {habits.map((habit) => {
                const colorClass = habit.color === 'secondary' ? 'bg-secondary' : habit.color === 'tertiary' ? 'bg-tertiary' : 'bg-primary';
                const iconBg = habit.color === 'secondary' ? 'bg-secondary/10 text-secondary' : habit.color === 'tertiary' ? 'bg-tertiary/10 text-tertiary' : 'bg-primary/10 text-primary';
                return (
                  <div key={habit._id} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/5 hover:shadow-xl transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
                        <span className="material-symbols-outlined text-xl">{habit.icon}</span>
                      </div>
                      <span className={`text-lg font-extrabold ${(habitRates.get(habit._id) || 0) >= 80 ? 'text-success' : (habitRates.get(habit._id) || 0) >= 50 ? 'text-warning' : 'text-error'}`}>
                        {habitRates.get(habit._id) || 0}%
                      </span>
                    </div>
                    <h4 className="font-semibold text-on-surface mb-1">{habit.name}</h4>
                    <p className="text-xs text-on-surface-variant mb-4">{habit.description || habit.frequency}</p>
                    <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                      <div className={`${colorClass} h-full rounded-full`} style={{ width: `${habitRates.get(habit._id) || 0}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </AnimatedItem>
      </AnimatedList>
    </>
  );
}
