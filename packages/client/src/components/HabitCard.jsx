import { motion, useReducedMotion } from 'framer-motion';

const colorMap = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', btnBg: 'bg-primary' },
  secondary: { bg: 'bg-secondary/10', text: 'text-secondary', btnBg: 'bg-secondary' },
  tertiary: { bg: 'bg-tertiary/10', text: 'text-tertiary', btnBg: 'bg-tertiary' },
};

const barColors = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  tertiary: 'var(--color-tertiary)',
};

export default function HabitCard({ habit, completed, progress = 0, onToggle, weeklyHours = null }) {
  const colors = colorMap[habit.color] || colorMap.primary;
  const barColor = barColors[habit.color] || barColors.primary;
  const targetWidth = completed ? 100 : Math.max(progress, 5);
  const shouldReduce = useReducedMotion();

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl flex items-center justify-between group hover:shadow-sm transition-all duration-300">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <span className={`p-2 rounded-lg ${colors.bg} ${colors.text}`} aria-hidden="true">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{habit.icon}</span>
          </span>
          <div>
            <h3 className="font-headline font-semibold text-lg">{habit.name}</h3>
            {habit.categoryId && habit.categoryId.name && (
              <span
                className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1"
                style={{
                  backgroundColor: `${habit.categoryId.color}15`,
                  color: habit.categoryId.color,
                }}
              >
                {habit.categoryId.name}
              </span>
            )}
          </div>
        </div>
        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden" aria-hidden="true">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: completed ? barColor : 'rgb(var(--color-surface-dim))' }}
            initial={{ width: '0%' }}
            animate={{ width: shouldReduce ? `${targetWidth}%` : `${targetWidth}%` }}
            transition={shouldReduce ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
      <div className="ml-8">
        {habit.trackingType === 'duration' ? (
          <button onClick={onToggle}
            aria-label={`${habit.name}: ${weeklyHours ?? 0} of ${habit.weeklyTarget} hours logged. ${completed ? 'Mark incomplete' : 'Log time'}`}
            aria-pressed={completed}
            className={`px-3 py-2 rounded-xl font-bold text-sm transition-all ${
              completed
                ? `${colors.btnBg} text-white`
                : 'border-2 border-outline-variant/30 text-outline-variant hover:border-primary/50'
            }`}>
            {weeklyHours != null ? `${weeklyHours}/${habit.weeklyTarget}h` : `0/${habit.weeklyTarget}h`}
          </button>
        ) : (
          <button onClick={onToggle}
            aria-label={`${habit.name}: ${completed ? 'completed, click to undo' : 'not completed, click to complete'}`}
            aria-pressed={completed}
            className={`w-12 h-12 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
              completed
                ? `${colors.btnBg} text-white`
                : 'border-2 border-outline-variant/30 text-outline-variant hover:border-primary/50 hover:text-primary'
            }`}>
            <span className="material-symbols-outlined" aria-hidden="true">{completed ? 'check_circle' : 'radio_button_unchecked'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
