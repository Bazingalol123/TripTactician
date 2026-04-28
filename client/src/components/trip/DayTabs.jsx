export default function DayTabs({ days = [], selectedDay, onSelect, conflictDays = new Set() }) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
      {days.map((day) => {
        const hasConflict = conflictDays.has(day.dayNumber);
        const active = selectedDay === day.dayNumber;
        return (
          <button
            key={day.dayNumber}
            onClick={() => onSelect(day.dayNumber)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Day {day.dayNumber}
            {hasConflict && <span className="ml-1 text-yellow-400">⚠</span>}
          </button>
        );
      })}
    </div>
  );
}
