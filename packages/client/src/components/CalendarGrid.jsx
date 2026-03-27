const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarGrid({ year, month, dayData = {}, selectedDate, onSelectDate }) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-4 md:p-8 shadow-sm">
      <div className="grid grid-cols-7 mb-4">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs font-bold uppercase tracking-widest text-outline py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="aspect-square p-2 bg-surface/30" />;
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const completions = dayData[dateStr] || [];
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === today;

          return (
            <div key={i} onClick={() => onSelectDate(dateStr)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectDate(dateStr); } }}
              tabIndex={0}
              role="button"
              aria-label={`${new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, ${completions.length} completion${completions.length !== 1 ? 's' : ''}`}
              aria-pressed={isSelected}
              className={`aspect-square p-2 md:p-3 min-h-[44px] cursor-pointer transition-all border ${
                isSelected ? 'bg-primary-container/10 border-2 border-primary ring-4 ring-primary/5' :
                'bg-surface-container-lowest border-surface-container hover:bg-surface-container-low'
              }`}>
              <span className={`text-sm font-bold ${isSelected ? 'text-primary font-extrabold' : isToday ? 'text-primary' : 'text-on-surface-variant'}`}>{day}</span>
              <div className="mt-1 flex flex-wrap gap-0.5">
                {completions.slice(0, 4).map((c, ci) => (
                  <span key={ci} className="w-1.5 h-1.5 rounded-full bg-secondary" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
