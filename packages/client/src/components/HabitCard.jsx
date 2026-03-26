const colorMap = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', btnBg: 'bg-primary' },
  secondary: { bg: 'bg-secondary/10', text: 'text-secondary', btnBg: 'bg-secondary' },
  tertiary: { bg: 'bg-tertiary/10', text: 'text-tertiary', btnBg: 'bg-tertiary' },
};

export default function HabitCard({ habit, completed, progress = 0, onToggle }) {
  const colors = colorMap[habit.color] || colorMap.primary;

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl flex items-center justify-between group hover:shadow-sm transition-all duration-300">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <span className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{habit.icon}</span>
          </span>
          <h3 className="font-headline font-semibold text-lg">{habit.name}</h3>
        </div>
        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
          <div className={`${completed ? colors.btnBg : 'bg-surface-dim'} h-full rounded-full transition-all duration-500`}
            style={{ width: `${completed ? 100 : Math.max(progress, 5)}%` }} />
        </div>
      </div>
      <div className="ml-8">
        <button onClick={onToggle}
          className={`w-12 h-12 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
            completed
              ? `${colors.btnBg} text-white`
              : 'border-2 border-outline-variant/30 text-outline-variant hover:border-primary/50 hover:text-primary'
          }`}>
          <span className="material-symbols-outlined">{completed ? 'check_circle' : 'radio_button_unchecked'}</span>
        </button>
      </div>
    </div>
  );
}
