import { useState, useMemo } from 'react';
import { useMonthlyAnalytics } from '../hooks/useAnalytics';
import { useHabits } from '../hooks/useHabits';
import { useCompletionsByDate } from '../hooks/useCompletions';
import CalendarGrid from '../components/CalendarGrid';
import DayDetailPanel from '../components/DayDetailPanel';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Calendar() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState(now.toISOString().split('T')[0]);

  const { data: monthly } = useMonthlyAnalytics(month, year);
  const { data: habits = [] } = useHabits();
  const { data: dayCompletions = [] } = useCompletionsByDate(selectedDate);

  const dayData = useMemo(() => {
    const map = {};
    if (monthly?.days) {
      for (const d of monthly.days) {
        map[d.date] = d.completions;
      }
    }
    return map;
  }, [monthly]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">
            {MONTH_NAMES[month - 1]} {year}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow">
          <CalendarGrid year={year} month={month} dayData={dayData} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </div>
        <aside className="w-full lg:w-96 shrink-0">
          <DayDetailPanel date={selectedDate} completions={dayCompletions} habits={habits} />
        </aside>
      </div>
    </>
  );
}
