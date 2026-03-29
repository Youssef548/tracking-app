import { useState, useEffect } from 'react';
import { useHabits } from '../hooks/useHabits';
import { useCompletionsByRange } from '../hooks/useCompletions';
import { useWeeklyPlan } from '../hooks/useWeeklyPlan';
import { useWeeklyReview, useUpsertWeeklyReview } from '../hooks/useWeeklyReview';
import {
  getCurrentWeekKey,
  getWeekDays,
  toDateString,
  formatWeekLabel,
  prevWeekKey,
  nextWeekKey,
} from '../utils/weekUtils';
import type { Habit, TotalsEntry } from '@mindful-flow/shared/types';

export default function ReviewPage() {
  const [weekKey, setWeekKey] = useState(getCurrentWeekKey);
  const currentWeekKey = getCurrentWeekKey();
  const isFutureWeek = weekKey > currentWeekKey;

  const weekDays = getWeekDays(weekKey);
  const from = toDateString(weekDays[0]);
  const to = toDateString(weekDays[6]);

  const { data: habits = [] } = useHabits();
  const { data: completions = [] } = useCompletionsByRange(from, to);
  const { data: plan } = useWeeklyPlan(weekKey);
  const { data: review } = useWeeklyReview(weekKey);
  const upsertReview = useUpsertWeeklyReview();

  const [wentWell, setWentWell] = useState('');
  const [toImprove, setToImprove] = useState('');
  const [changesNextWeek, setChangesNextWeek] = useState('');
  const [saved, setSaved] = useState(false);

  // Populate form when review loads
  useEffect(() => {
    if (review) {
      setWentWell(review.wentWell);
      setToImprove(review.toImprove);
      setChangesNextWeek(review.changesNextWeek);
    } else {
      setWentWell('');
      setToImprove('');
      setChangesNextWeek('');
    }
    setSaved(false);
  }, [review, weekKey]);

  const activeHabits = habits.filter((h) => h.isActive);

  function getTarget(habit: Habit): number {
    const override = plan?.habitTargetOverrides.find((o) => o.habitId === habit._id);
    return override?.targetDays ?? habit.target;
  }

  function getDoneCount(habitId: string): number {
    return completions.filter(
      (c) =>
        c.habitId._id === habitId &&
        c.date.slice(0, 10) >= from &&
        c.date.slice(0, 10) <= to,
    ).length;
  }

  const totals: TotalsEntry[] = activeHabits.map((h) => ({
    habitId: h._id,
    habitName: h.name,
    done: getDoneCount(h._id),
    target: getTarget(h),
  }));

  const overallDone = totals.reduce((s, t) => s + t.done, 0);
  const overallTarget = totals.reduce((s, t) => s + t.target, 0);
  const overallScore =
    overallTarget > 0 ? Math.round((overallDone / overallTarget) * 100) : 0;

  function handleSave() {
    upsertReview.mutate(
      { weekKey, wentWell, toImprove, changesNextWeek, totals },
      { onSuccess: () => setSaved(true) },
    );
  }

  const isPastWeek = weekKey < currentWeekKey;
  const isReadOnly = isPastWeek && !!review;

  return (
    <div className="max-w-xl">
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
        {review && (
          <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-full">
            Saved
          </span>
        )}
      </div>

      {/* Week note context */}
      {plan?.weekNote && (
        <p className="text-sm text-on-surface-variant italic mb-4 bg-surface-container-high px-3 py-2 rounded-lg">
          📌 {plan.weekNote}
        </p>
      )}

      {/* Totals table */}
      <div className="bg-surface-container-lowest rounded-xl mb-6 overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant/20">
          <h2 className="font-semibold text-on-surface text-sm">Totals</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/10">
              <th className="text-left px-4 py-2 text-xs text-on-surface-variant font-semibold uppercase tracking-wide">
                Activity
              </th>
              <th className="text-center px-2 py-2 text-xs text-on-surface-variant font-semibold uppercase tracking-wide">
                Done
              </th>
              <th className="text-center px-2 py-2 text-xs text-on-surface-variant font-semibold uppercase tracking-wide">
                Target
              </th>
              <th className="text-center px-4 py-2 text-xs text-on-surface-variant font-semibold uppercase tracking-wide">
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {totals.map((t) => {
              const pct = t.target > 0 ? Math.round((t.done / t.target) * 100) : 0;
              return (
                <tr key={t.habitId} className="border-t border-outline-variant/10">
                  <td className="px-4 py-2 text-on-surface">
                    {activeHabits.find((h) => h._id === t.habitId)?.icon} {t.habitName}
                  </td>
                  <td className="text-center px-2 py-2 tabular-nums text-on-surface">{t.done}</td>
                  <td className="text-center px-2 py-2 tabular-nums text-on-surface-variant">{t.target}</td>
                  <td className="text-center px-4 py-2">
                    <span
                      className={`text-xs font-semibold ${
                        pct >= 80
                          ? 'text-primary'
                          : pct >= 50
                          ? 'text-tertiary'
                          : 'text-error'
                      }`}
                    >
                      {pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-outline-variant/30 font-bold">
              <td className="px-4 py-2 text-on-surface">Overall</td>
              <td className="text-center px-2 py-2 tabular-nums text-on-surface">{overallDone}</td>
              <td className="text-center px-2 py-2 tabular-nums text-on-surface-variant">{overallTarget}</td>
              <td className="text-center px-4 py-2">
                <span
                  className={`text-sm font-bold ${
                    overallScore >= 80
                      ? 'text-primary'
                      : overallScore >= 50
                      ? 'text-tertiary'
                      : 'text-error'
                  }`}
                >
                  {overallScore}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Reflection */}
      <div className="space-y-4">
        {[
          { label: 'What did I do well?', value: wentWell, set: setWentWell },
          { label: 'What do I want to improve?', value: toImprove, set: setToImprove },
          { label: 'Any changes for next week?', value: changesNextWeek, set: setChangesNextWeek },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <label className="block text-sm font-semibold text-on-surface mb-1">{label}</label>
            <textarea
              value={value}
              onChange={(e) => set(e.target.value)}
              readOnly={isReadOnly}
              rows={3}
              placeholder={isReadOnly ? '—' : 'Write your reflection...'}
              className="w-full bg-surface-container-high rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/40 outline-none focus:ring-2 focus:ring-primary/40 resize-none disabled:opacity-70"
            />
          </div>
        ))}
      </div>

      {/* Save button */}
      {!isReadOnly && (
        <button
          onClick={handleSave}
          disabled={upsertReview.isPending}
          className="mt-5 w-full py-3 bg-primary text-on-primary font-semibold rounded-xl disabled:opacity-50 transition-opacity"
        >
          {upsertReview.isPending ? 'Saving...' : saved ? 'Saved ✓' : 'Save Review'}
        </button>
      )}
    </div>
  );
}
