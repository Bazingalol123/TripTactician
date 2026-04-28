import { useTrip } from '../../hooks/useTrip.js';
import { useActivities } from '../../hooks/useActivities.js';
import { useConflicts } from '../../hooks/useConflicts.js';
import { formatDateRange } from '../../utils/dates.js';
import { X, Map, Settings } from 'lucide-react';

export default function TripSubPanel({ tripId, selectedDay, onDaySelect, onClose, onOpenMap, onOpenSettings }) {
  const { trip } = useTrip(tripId);
  const { activities } = useActivities(tripId);
  const { conflicted } = useConflicts(activities);

  if (!trip) return null;

  const conflictDays = new Set(conflicted.map(a => a.dayNumber));

  return (
    <div className="w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{trip.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatDateRange(trip.startDate, trip.endDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-500 ml-2 shrink-0 mt-0.5"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {trip.days?.map(day => {
          const isActive = day.dayNumber === selectedDay;
          const hasConflict = conflictDays.has(day.dayNumber);

          return (
            <button
              key={day.dayNumber}
              onClick={() => onDaySelect(day.dayNumber)}
              className={`
                w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors
                ${isActive
                  ? 'bg-blue-50 border-l-2 border-blue-500'
                  : 'hover:bg-gray-50 border-l-2 border-transparent'
                }
              `}
            >
              <span className={`text-xs font-medium w-10 shrink-0 ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}>
                Day {day.dayNumber}
              </span>
              <span className={`text-sm truncate flex-1 ${
                hasConflict ? 'text-amber-600' : isActive ? 'text-blue-700' : 'text-gray-700'
              }`}>
                {day.label || `Day ${day.dayNumber}`}
              </span>
              {hasConflict && (
                <span className="text-amber-500 text-xs shrink-0">⚠</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-2">
        {trip.participants?.length > 0 && (
          <div className="flex items-center gap-1.5 mb-1">
            {trip.participants.map((p, i) => {
              const name = p.userId?.name || p.userId?.email || '?';
              const initial = name[0].toUpperCase();
              return (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0"
                  style={{ background: i === 0 ? '#2563EB' : '#7C3AED' }}
                  title={name}
                >
                  {initial}
                </div>
              );
            })}
            <span className="text-xs text-gray-400 ml-1">
              {trip.participants.map(p => p.userId?.name?.split(' ')[0]).join(' & ')}
            </span>
          </div>
        )}

        <button
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 py-1 transition-colors"
          onClick={onOpenMap}
        >
          <Map size={13} />
          Open map
        </button>
        <button
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 py-1 transition-colors"
          onClick={onOpenSettings}
        >
          <Settings size={13} />
          Trip settings
        </button>
      </div>
    </div>
  );
}
