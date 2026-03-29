import { useState } from 'react';
import { useHabits } from '../hooks/useHabits';
import { useMonthlyGoals, useUpsertMonthlyGoal } from '../hooks/useMonthlyGoals';
import {
  getMonthKey,
  formatMonthLabel,
  prevMonthKey,
  nextMonthKey,
} from '../utils/weekUtils';
import type { Habit, MonthlyGoalItem, GoalItem } from '@mindful-flow/shared/types';

// ─── Habits tab (reuse existing Habits page logic inline) ──────────
import { lazy, Suspense } from 'react';
import HabitsSkeleton from '../components/skeletons/HabitsSkeleton';
const HabitsContent = lazy(() => import('./Habits'));

// ─── Goals tab ─────────────────────────────────────────────────────

interface HabitCardProps {
  habit: Habit;
  goalData: MonthlyGoalItem | undefined;
  monthKey: string;
}

function HabitGoalCard({ habit, goalData, monthKey }: HabitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const upsert = useUpsertMonthlyGoal();

  const items = goalData?.items ?? [];
  const doneCount = items.filter((it) => it.completed).length;

  function saveItems(updatedItems: Omit<GoalItem, '_id'>[]) {
    upsert.mutate({ monthKey, habitId: habit._id, items: updatedItems });
  }

  function toggleItem(item: GoalItem) {
    const updated = items.map((it) =>
      it._id === item._id ? { text: it.text, completed: !it.completed, order: it.order } : it,
    );
    saveItems(updated);
  }

  function addItem() {
    const text = newItemText.trim();
    if (!text) return;
    const updated = [
      ...items.map((it) => ({ text: it.text, completed: it.completed, order: it.order })),
      { text, completed: false, order: items.length },
    ];
    saveItems(updated);
    setNewItemText('');
  }

  function deleteItem(itemId: string) {
    const updated = items
      .filter((it) => it._id !== itemId)
      .map((it, idx) => ({ text: it.text, completed: it.completed, order: idx }));
    saveItems(updated);
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
      {/* Card header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{habit.icon}</span>
          <span className="font-semibold text-on-surface">{habit.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-on-surface-variant">
            {doneCount}/{items.length} done
          </span>
          <span className="material-symbols-outlined text-on-surface-variant text-sm">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </button>

      {/* Checklist */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-outline-variant/20">
          {items.length === 0 && (
            <p className="text-sm text-on-surface-variant/60 py-2">No items yet.</p>
          )}
          {items.map((item) => (
            <div key={item._id} className="flex items-center gap-3 group">
              <button
                onClick={() => toggleItem(item)}
                className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-colors ${
                  item.completed
                    ? 'bg-primary text-on-primary'
                    : 'border-2 border-outline-variant'
                }`}
                aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {item.completed && (
                  <span className="material-symbols-outlined text-xs">check</span>
                )}
              </button>
              <span
                className={`flex-1 text-sm ${
                  item.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'
                }`}
              >
                {item.text}
              </span>
              <button
                onClick={() => deleteItem(item._id)}
                className="opacity-0 group-hover:opacity-100 text-on-surface-variant/50 hover:text-error transition-all"
                aria-label="Delete item"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ))}

          {/* Add item */}
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder="Add item..."
              className="flex-1 bg-surface-container-high rounded-lg px-3 py-1.5 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={addItem}
              disabled={!newItemText.trim()}
              className="px-3 py-1.5 bg-primary text-on-primary text-sm font-semibold rounded-lg disabled:opacity-40 transition-opacity"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────

export default function MonthPage() {
  const [tab, setTab] = useState<'goals' | 'habits'>('goals');
  const [monthKey, setMonthKey] = useState(getMonthKey);

  const { data: habits = [] } = useHabits();
  const { data: monthlyGoals = [] } = useMonthlyGoals(monthKey);

  const activeHabits = habits.filter((h) => h.isActive);
  const currentMonthKey = getMonthKey();
  const isFutureMonth = monthKey > currentMonthKey;

  function getGoalData(habitId: string): MonthlyGoalItem | undefined {
    return monthlyGoals.find((g) => g.habitId === habitId);
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-outline-variant/20 mb-5">
        <button
          onClick={() => setTab('goals')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            tab === 'goals'
              ? 'text-primary border-b-2 border-primary'
              : 'text-on-surface-variant'
          }`}
        >
          This Month's Goals
        </button>
        <button
          onClick={() => setTab('habits')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            tab === 'habits'
              ? 'text-primary border-b-2 border-primary'
              : 'text-on-surface-variant'
          }`}
        >
          Habits
        </button>
      </div>

      {tab === 'goals' && (
        <div>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMonthKey(prevMonthKey(monthKey))}
              className="p-1 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
              aria-label="Previous month"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <h2 className="font-bold text-on-surface font-headline">
              {formatMonthLabel(monthKey)}
            </h2>
            <button
              onClick={() => !isFutureMonth && setMonthKey(nextMonthKey(monthKey))}
              disabled={isFutureMonth}
              className="p-1 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors disabled:opacity-30"
              aria-label="Next month"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          {activeHabits.length === 0 ? (
            <p className="text-center text-on-surface-variant py-12 text-sm">
              Add habits in the Habits tab first.
            </p>
          ) : (
            <div className="space-y-3">
              {activeHabits.map((habit) => (
                <HabitGoalCard
                  key={habit._id}
                  habit={habit}
                  goalData={getGoalData(habit._id)}
                  monthKey={monthKey}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'habits' && (
        <Suspense fallback={<HabitsSkeleton />}>
          <HabitsContent />
        </Suspense>
      )}
    </div>
  );
}
