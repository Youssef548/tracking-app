import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHabits } from '../hooks/useHabits';
import { useCompletionsByRange, useCreateCompletion, useDeleteCompletion } from '../hooks/useCompletions';
import { useWeeklyPlan } from '../hooks/useWeeklyPlan';
import WeekSetupModal from '../components/WeekSetupModal';
import {
  getCurrentWeekKey,
  getWeekDays,
  prevWeekKey,
  nextWeekKey,
  toDateString,
  formatWeekLabel,
  DAY_LABELS,
} from '../utils/weekUtils';
import type { Completion, Habit } from '@mindful-flow/shared/types';

export default function WeekPage() {
  const navigate = useNavigate();
  const [weekKey, setWeekKey] = useState(getCurrentWeekKey);
  const [showSetup, setShowSetup] = useState(false);

  const weekDays = getWeekDays(weekKey);
  const from = toDateString(weekDays[0]);
  const to = toDateString(weekDays[6]);

  const { data: habits = [] } = useHabits();
  const { data: completions = [] } = useCompletionsByRange(from, to);
  const { data: plan } = useWeeklyPlan(weekKey);
  const createCompletion = useCreateCompletion();
  const deleteCompletion = useDeleteCompletion();

  const activeHabits = habits.filter((h) => h.isActive);
  const currentWeekKey = getCurrentWeekKey();
  const isFutureWeek = weekKey > currentWeekKey;

  function getTarget(habit: Habit): number {
    const override = plan?.habitTargetOverrides.find((o) => o.habitId === habit._id);
    return override?.targetDays ?? habit.target;
  }

  function findCompletion(habitId: string, date: Date): Completion | undefined {
    const ds = toDateString(date);
    return completions.find(
      (c) => c.habitId._id === habitId && c.date.slice(0, 10) === ds,
    );
  }

  const FRIDAY_INDEX = 6; // week layout: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6

  function toggleCell(habitId: string, date: Date, dayIndex: number) {
    const isFriday = dayIndex === FRIDAY_INDEX;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const isFuture = date > today;
    if (isFriday || isFuture) return;

    const existing = findCompletion(habitId, date);
    if (existing) {
      deleteCompletion.mutate(existing._id);
    } else {
      createCompletion.mutate({ habitId, date: toDateString(date) });
    }
  }

  function getDoneCount(habitId: string): number {
    return completions.filter(
      (c) =>
        c.habitId._id === habitId &&
        c.date.slice(0, 10) >= from &&
        c.date.slice(0, 10) <= to,
    ).length;
  }

  const totalScheduled = activeHabits.reduce((sum, h) => sum + getTarget(h), 0);
  const totalDone = activeHabits.reduce((sum, h) => sum + getDoneCount(h._id), 0);
  const score = totalScheduled > 0 ? Math.round((totalDone / totalScheduled) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekKey(prevWeekKey(weekKey))}
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Previous week"
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
          <h1 className="font-bold text-on-surface font-headline">
            Week of {formatWeekLabel(weekKey)}
            {weekKey === currentWeekKey && (
              <span className="ml-2 text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                This week
              </span>
            )}
          </h1>
          <button
            onClick={() => !isFutureWeek && setWeekKey(nextWeekKey(weekKey))}
            disabled={isFutureWeek}
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-30"
            aria-label="Next week"
          >
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>
        </div>
        <button
          onClick={() => setShowSetup(true)}
          className="text-xs font-semibold text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
        >
          Set up week
        </button>
      </div>

      {/* Week note */}
      {plan?.weekNote && (
        <p className="text-sm text-on-surface-variant italic mb-4 bg-surface-container-high px-3 py-2 rounded-lg">
          📌 {plan.weekNote}
        </p>
      )}

      {/* Grid */}
      {activeHabits.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl mb-3 block">checklist</span>
          <p className="font-semibold">No habits yet</p>
          <p className="text-sm mt-1">Go to Month → Habits to add your first habit.</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[480px] text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 pr-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wide w-28">
                  Activity
                </th>
                {weekDays.map((day, i) => {
                  const label = DAY_LABELS[i] ?? '';
                  const isToday = toDateString(day) === toDateString(new Date());
                  return (
                    <th
                      key={i}
                      className={`text-center py-2 px-1 font-semibold text-xs uppercase tracking-wide w-9 ${
                        i === FRIDAY_INDEX
                          ? 'text-on-surface-variant/40'
                          : isToday
                          ? 'text-primary'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {label}
                    </th>
                  );
                })}
                <th className="text-center py-2 pl-2 font-semibold text-xs uppercase tracking-wide text-on-surface-variant w-12">
                  Done
                </th>
              </tr>
            </thead>
            <tbody>
              {activeHabits.map((habit) => {
                const done = getDoneCount(habit._id);
                const target = getTarget(habit);
                const isOnTrack = done >= target;
                return (
                  <tr key={habit._id} className="border-t border-outline-variant/20">
                    <td className="py-2.5 pr-3">
                      <span className="font-medium text-on-surface text-sm">
                        {habit.icon} {habit.name}
                      </span>
                    </td>
                    {weekDays.map((day, i) => {
                      const isFriday = i === FRIDAY_INDEX;
                      const today = new Date();
                      today.setHours(23, 59, 59, 999);
                      const isFuture = day > today;
                      const completion = findCompletion(habit._id, day);
                      const isToday = toDateString(day) === toDateString(new Date());

                      return (
                        <td key={i} className="text-center py-2.5 px-1">
                          {isFriday ? (
                            <span className="text-on-surface-variant/30 text-base">🍹</span>
                          ) : isFuture ? (
                            <span className="text-on-surface-variant/20 text-lg">·</span>
                          ) : (
                            <button
                              onClick={() => toggleCell(habit._id, day, i)}
                              className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto transition-all active:scale-90 ${
                                completion
                                  ? 'bg-primary text-on-primary shadow-sm'
                                  : isToday
                                  ? 'border-2 border-primary/50 text-transparent hover:border-primary'
                                  : 'border border-outline-variant/50 text-transparent hover:border-primary/50'
                              }`}
                              aria-label={`Toggle ${habit.name} on ${DAY_LABELS[i] ?? ''}`}
                            >
                              {completion && (
                                <span className="material-symbols-outlined text-sm">check</span>
                              )}
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center py-2.5 pl-2">
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          isOnTrack ? 'text-primary' : 'text-on-surface-variant'
                        }`}
                      >
                        {done}/{target}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-outline-variant/20">
        <div className="text-sm text-on-surface-variant">
          Score:{' '}
          <span
            className={`font-bold text-base ${
              score >= 80 ? 'text-primary' : score >= 50 ? 'text-tertiary' : 'text-error'
            }`}
          >
            {score}%
          </span>
        </div>
        <button
          onClick={() => navigate('/review')}
          className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline"
        >
          Write review
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>

      {showSetup && (
        <WeekSetupModal
          weekKey={weekKey}
          habits={activeHabits}
          plan={plan ?? null}
          onClose={() => setShowSetup(false)}
        />
      )}
    </div>
  );
}
