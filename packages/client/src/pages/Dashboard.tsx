import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../hooks/useHabits';
import { useCompletionsByDate, useCreateCompletion, useDeleteCompletion } from '../hooks/useCompletions';
import { useWeeklyAnalytics } from '../hooks/useAnalytics';
import HabitCard from '../components/HabitCard';
import ProgressRing from '../components/ProgressRing';
import StatCard from '../components/StatCard';
import AnimatedList, { AnimatedItem } from '../components/AnimatedList';
import DurationInput from '../components/DurationInput';
import type { Habit } from '@mindful-flow/shared/types';

function getToday(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

function getGreeting(): string {
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
  const [durationHabit, setDurationHabit] = useState<Habit | null>(null);

  const completedIds = new Set(
    completions.map((c) =>
      typeof c.habitId === 'object' && c.habitId !== null && '_id' in c.habitId
        ? (c.habitId as { _id: string })._id
        : String(c.habitId)
    )
  );
  const completedCount = habits.filter((h) => completedIds.has(h._id)).length;

  function handleToggle(habit: Habit) {
    if (habit.trackingType === 'duration') {
      const existing = completions.find((c) => {
        const id = typeof c.habitId === 'object' && c.habitId !== null && '_id' in c.habitId
          ? (c.habitId as { _id: string })._id
          : String(c.habitId);
        return id === habit._id;
      });
      if (existing) {
        deleteCompletion.mutate(existing._id);
      } else {
        setDurationHabit(habit);
      }
      return;
    }
    const existing = completions.find((c) => {
      const id = typeof c.habitId === 'object' && c.habitId !== null && '_id' in c.habitId
        ? (c.habitId as { _id: string })._id
        : String(c.habitId);
      return id === habit._id;
    });
    if (existing) {
      deleteCompletion.mutate(existing._id);
    } else {
      createCompletion.mutate({ habitId: habit._id, date: today });
    }
  }

  function handleDurationSubmit(hours: number) {
    if (!durationHabit) return;
    createCompletion.mutate({ habitId: durationHabit._id, date: today, value: hours });
    setDurationHabit(null);
  }

  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <>
      <section className="mb-6 md:mb-10">
        <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-2">
          {getGreeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-on-surface-variant font-medium">{dayName}, {dateStr}</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-headline text-xl font-bold">Today's Habits</h2>
            {habits.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-2xl font-extrabold font-headline text-on-surface">{completedCount}/{habits.length}</span>
                <span className="text-xs font-medium text-on-surface-variant">done</span>
              </div>
            )}
          </div>
          <AnimatedList className="space-y-6">
            {habits.map((habit) => (
              <AnimatedItem key={habit._id}>
                <HabitCard
                  habit={habit}
                  completed={completedIds.has(habit._id)}
                  onToggle={() => handleToggle(habit)}
                  weeklyHours={
                    habit.trackingType === 'duration'
                      ? completions
                          .filter((c) => {
                            const id = typeof c.habitId === 'object' && c.habitId !== null && '_id' in c.habitId
                              ? (c.habitId as { _id: string })._id
                              : String(c.habitId);
                            return id === habit._id;
                          })
                          .reduce((sum, c) => sum + (c.value ?? 0), 0)
                      : null
                  }
                />
              </AnimatedItem>
            ))}
          </AnimatedList>
          {habits.length === 0 && (
            <div className="py-12">
              <h3 className="font-headline text-2xl font-bold text-on-surface mb-8">Get started in 3 steps</h3>
              <div className="space-y-6 mb-10">
                <div className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary text-on-primary font-bold text-sm flex items-center justify-center">1</span>
                  <div>
                    <h4 className="font-semibold text-on-surface">Create a habit</h4>
                    <p className="text-sm text-on-surface-variant mt-1">Pick something small you want to do daily — reading, exercise, journaling.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">2</span>
                  <div>
                    <h4 className="font-semibold text-on-surface">Check in daily</h4>
                    <p className="text-sm text-on-surface-variant mt-1">Come back each day and mark what you completed. Your streak counter tracks consecutive days.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">3</span>
                  <div>
                    <h4 className="font-semibold text-on-surface">Review your week</h4>
                    <p className="text-sm text-on-surface-variant mt-1">The <span className="font-semibold">Weekly Tracking</span> page shows a habit × day grid with your completion rate. Your <span className="font-semibold">Weekly Score</span> = % of targets hit.</p>
                  </div>
                </div>
              </div>
              <Link to="/habits"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold shadow-sm hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-lg" aria-hidden="true">add_circle</span>
                Create your first habit
              </Link>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm">
            <h2 className="font-headline text-xl font-bold mb-8">Weekly Score</h2>
            <div className="flex flex-col items-center">
              <ProgressRing percent={weekly?.score ?? 0} />
              <p className="text-center text-on-surface-variant text-sm leading-relaxed px-4 mt-6">
                <span className="text-secondary font-bold">{weekly?.completedCount ?? 0}</span> of <span className="font-medium">{weekly?.targetCount ?? 0}</span> completed this week
              </p>
            </div>
          </div>
          <StatCard icon="bolt" value={weekly?.streak ?? 0} label="Day Streak" iconColor="text-primary" />
        </div>
      </div>

      <DurationInput
        open={!!durationHabit}
        onClose={() => setDurationHabit(null)}
        onSubmit={handleDurationSubmit}
        habitName={durationHabit?.name ?? ''}
      />
    </>
  );
}
