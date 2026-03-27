import { useAuth } from '../context/AuthContext';
import { useHabits } from '../hooks/useHabits';
import { useCompletionsByDate, useCreateCompletion, useDeleteCompletion } from '../hooks/useCompletions';
import { useWeeklyAnalytics } from '../hooks/useAnalytics';
import HabitCard from '../components/HabitCard';
import ProgressRing from '../components/ProgressRing';
import StatCard from '../components/StatCard';
import AnimatedList, { AnimatedItem } from '../components/AnimatedList';

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: habits = [] } = useHabits();
  const today = getToday();
  const { data: completions = [] } = useCompletionsByDate(today);
  const { data: weekly } = useWeeklyAnalytics();
  const createCompletion = useCreateCompletion();
  const deleteCompletion = useDeleteCompletion();

  const dailyHabits = habits.filter((h) => h.frequency === 'daily');
  const completedIds = new Set(completions.map((c) => c.habitId?._id || c.habitId));
  const completedCount = dailyHabits.filter((h) => completedIds.has(h._id)).length;

  function handleToggle(habit) {
    const existing = completions.find((c) => (c.habitId?._id || c.habitId) === habit._id);
    if (existing) {
      deleteCompletion.mutate(existing._id);
    } else {
      createCompletion.mutate({ habitId: habit._id, date: today });
    }
  }

  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <>
      <section className="mb-10">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mb-2">
          {getGreeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-on-surface-variant font-medium">{dayName}, {dateStr}</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-headline text-xl font-bold">Daily Rituals</h2>
            <span className="text-sm font-semibold text-primary bg-primary/5 px-3 py-1 rounded-full">
              {completedCount} of {dailyHabits.length} completed
            </span>
          </div>
          <AnimatedList className="space-y-6">
            {dailyHabits.map((habit) => (
              <AnimatedItem key={habit._id}>
                <HabitCard habit={habit} completed={completedIds.has(habit._id)}
                  onToggle={() => handleToggle(habit)} />
              </AnimatedItem>
            ))}
          </AnimatedList>
          {dailyHabits.length === 0 && (
            <p className="text-on-surface-variant text-center py-12">No daily habits yet. Create one to get started!</p>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm relative overflow-hidden">
            <h2 className="font-headline text-xl font-bold mb-8">Weekly Flow</h2>
            <div className="flex flex-col items-center">
              <ProgressRing percent={weekly?.score || 0} />
              <p className="text-center text-on-surface-variant text-sm leading-relaxed px-4 mt-6">
                You've completed <span className="text-secondary font-bold">{weekly?.completedCount || 0} rituals</span> this week.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon="bolt" value={weekly?.streak || 0} label="Day Streak" iconColor="text-primary" />
            <StatCard icon="star" value={weekly?.score || 0} label="Weekly Score" iconColor="text-tertiary" />
          </div>
        </div>
      </div>
    </>
  );
}
