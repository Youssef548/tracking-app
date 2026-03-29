import { useState } from 'react';
import type { Habit, WeeklyPlan, WeeklyPlanHabitOverride } from '@mindful-flow/shared/types';
import { useUpsertWeeklyPlan } from '../hooks/useWeeklyPlan';
import { formatWeekLabel } from '../utils/weekUtils';

interface Props {
  weekKey: string;
  habits: Habit[];
  plan: WeeklyPlan | null;
  onClose: () => void;
}

export default function WeekSetupModal({ weekKey, habits, plan, onClose }: Props) {
  const upsert = useUpsertWeeklyPlan();

  const [weekNote, setWeekNote] = useState(plan?.weekNote ?? '');
  const [overrides, setOverrides] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const o of plan?.habitTargetOverrides ?? []) {
      map[o.habitId] = o.targetDays;
    }
    return map;
  });

  function getTarget(habit: Habit): number {
    return overrides[habit._id] ?? habit.target;
  }

  function setTarget(habitId: string, value: number) {
    setOverrides((prev) => ({ ...prev, [habitId]: value }));
  }

  function handleSave() {
    const habitTargetOverrides: WeeklyPlanHabitOverride[] = habits
      .filter((h) => overrides[h._id] !== undefined && overrides[h._id] !== h.target)
      .map((h) => ({ habitId: h._id, targetDays: overrides[h._id]! }));

    upsert.mutate({ weekKey, habitTargetOverrides, weekNote }, { onSuccess: onClose });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-lg font-bold text-on-surface mb-1">Set up Week</h2>
        <p className="text-sm text-on-surface-variant mb-4">Week of {formatWeekLabel(weekKey)}</p>

        <div className="space-y-3 mb-4">
          {habits.map((habit) => (
            <div key={habit._id} className="flex items-center justify-between">
              <span className="text-sm text-on-surface">
                {habit.icon} {habit.name}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTarget(habit._id, Math.max(1, getTarget(habit) - 1))}
                  className="w-7 h-7 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center text-lg leading-none"
                >
                  −
                </button>
                <span className="w-4 text-center text-sm font-semibold text-on-surface">
                  {getTarget(habit)}
                </span>
                <button
                  onClick={() => setTarget(habit._id, Math.min(6, getTarget(habit) + 1))}
                  className="w-7 h-7 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center text-lg leading-none"
                >
                  +
                </button>
                <span className="text-xs text-on-surface-variant w-12">days/wk</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wide">
            Week note (optional)
          </label>
          <input
            type="text"
            value={weekNote}
            onChange={(e) => setWeekNote(e.target.value)}
            placeholder="e.g. Hip flexor rehab — no gym"
            className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={upsert.isPending}
            className="flex-1 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold disabled:opacity-50"
          >
            {upsert.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
