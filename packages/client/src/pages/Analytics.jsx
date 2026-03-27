import { useWeeklyAnalytics } from '../hooks/useAnalytics';
import { useHabits } from '../hooks/useHabits';
import { useWeeklyConsistency } from '../hooks/useWeeklyConsistency';
import { TrendChart, ComparisonBar } from '../components/ChartBlock';
import AnimatedList, { AnimatedItem } from '../components/AnimatedList';

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
          <h1 className="font-headline font-extrabold text-4xl md:text-5xl tracking-tight text-on-surface mb-2">Performance</h1>
          <p className="text-on-surface-variant text-lg">
            Your weekly overview
          </p>
        </div>
      </div>

      <AnimatedList className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        <AnimatedItem className="md:col-span-4">
          <div className="bg-surface-container-lowest p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden h-full">
            <div>
              <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary-container/10 px-3 py-1 rounded-full">Current Status</span>
              <div className="mt-8">
                <h2 className="font-headline text-7xl font-extrabold text-on-surface leading-none">{weekly?.score || 0}%</h2>
                <p className="text-on-surface-variant font-medium mt-2">Weekly Score</p>
              </div>
            </div>
            <div className="mt-12">
              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${weekly?.score || 0}%` }} />
              </div>
            </div>
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
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
          <div className="bg-secondary-container/30 p-8 rounded-3xl flex flex-col justify-between border border-secondary/10 h-full">
            <div>
              <span className="material-symbols-outlined text-secondary text-3xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h3 className="font-headline font-extrabold text-2xl text-on-surface mb-3">Zen Pulse Tip</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Your current streak is <span className="font-bold text-secondary">{weekly?.streak || 0} days</span>. Keep building momentum!
              </p>
            </div>
          </div>
        </AnimatedItem>

        <AnimatedItem className="md:col-span-12 mt-4">
          <div>
            <h3 className="font-headline font-bold text-2xl mb-6">Habit Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {habits.map((habit) => {
                const colorClass = habit.color === 'secondary' ? 'bg-secondary' : habit.color === 'tertiary' ? 'bg-tertiary' : 'bg-primary';
                const iconBg = habit.color === 'secondary' ? 'bg-secondary/10 text-secondary' : habit.color === 'tertiary' ? 'bg-tertiary/10 text-tertiary' : 'bg-primary/10 text-primary';
                return (
                  <div key={habit._id} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/5 hover:shadow-xl transition-shadow">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
                        <span className="material-symbols-outlined">{habit.icon}</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-on-surface mb-1">{habit.name}</h4>
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
