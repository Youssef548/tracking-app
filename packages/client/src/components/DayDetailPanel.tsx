import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Habit, Completion } from '@mindful-flow/shared/types';

interface DayDetailPanelProps {
  date: string | null;
  completions?: Completion[];
  habits?: Habit[];
}

export default function DayDetailPanel({ date, completions = [], habits = [] }: DayDetailPanelProps) {
  const shouldReduce = useReducedMotion();
  const d = date ? new Date(date + 'T00:00:00') : null;
  const formatted = d ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '';

  const completedIds = new Set(
    completions.map((c) =>
      typeof c.habitId === 'object' && c.habitId !== null && '_id' in c.habitId
        ? (c.habitId as { _id: string })._id
        : String(c.habitId)
    )
  );
  const completed = habits.filter((h) => completedIds.has(h._id));
  const missed = habits.filter((h) => h.frequency === 'daily' && !completedIds.has(h._id));

  return (
    <AnimatePresence mode="wait">
      {date && (
        <motion.div
          key={date}
          className="bg-surface-container-low rounded-3xl p-8 shadow-sm border border-outline-variant/10"
          {...(shouldReduce ? {} : { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 }, transition: { duration: 0.25, ease: 'easeOut' } })}
        >
          <div className="mb-8">
            <span className="uppercase tracking-widest text-on-surface-variant font-bold text-xs">Details for</span>
            <h2 className="text-2xl font-headline font-extrabold text-on-surface mt-1">{formatted}</h2>
          </div>
          <div className="space-y-6">
            {completed.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                  <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">Completed</h3>
                </div>
                <div className="space-y-3">
                  {completed.map((h) => (
                    <div key={h._id} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-secondary/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined text-lg">{h.icon}</span>
                        </div>
                        <p className="text-sm font-bold text-on-surface">{h.name}</p>
                      </div>
                      <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {missed.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" />
                  <h3 className="text-sm font-bold text-tertiary uppercase tracking-wider">Missed</h3>
                </div>
                <div className="space-y-3">
                  {missed.map((h) => (
                    <div key={h._id} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-error/5 opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                          <span className="material-symbols-outlined text-lg">{h.icon}</span>
                        </div>
                        <p className="text-sm font-bold text-on-surface">{h.name}</p>
                      </div>
                      <span className="material-symbols-outlined text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {completed.length === 0 && missed.length === 0 && (
              <p className="text-on-surface-variant text-center py-8">No data for this day</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
