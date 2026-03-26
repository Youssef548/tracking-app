export default function FAB({ onClick }) {
  return (
    <button onClick={onClick}
      className="fixed bottom-28 right-6 md:bottom-8 md:right-8 bg-primary text-on-primary w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 group">
      <span className="material-symbols-outlined text-2xl md:text-3xl">add</span>
      <span className="absolute right-full mr-4 bg-on-surface text-surface text-xs font-bold py-2 px-4 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
        Add Habit
      </span>
    </button>
  );
}
