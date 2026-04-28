import ActivityList from './ActivityList.jsx';
import DayOrderToggle from './DayOrderToggle.jsx';
import Button from '../ui/Button.jsx';
import { formatDate } from '../../utils/dates.js';

export default function DayPanel({
  day,
  activities = [],
  isGenerating,
  onOrderChange,
  onAddActivity,
  onRemove,
  onSwap,
  onBook,
  onKeep,
  onFillGaps,
}) {
  if (isGenerating) {
    return (
      <div className="flex flex-col gap-3 py-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-blue-500">✦</span>
          <p className="text-sm font-medium text-gray-700">Building your trip…</p>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Finding places and building your itinerary. This takes about a minute.
        </p>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-gray-100 rounded-xl animate-pulse"
            style={{ opacity: 1 - i * 0.25 }}
          />
        ))}
      </div>
    );
  }

  const totalCost = activities.reduce((sum, a) => sum + (a.estimatedCostPerPerson || 0) * 2, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">
            Day {day.dayNumber}{day.label ? ` — ${day.label}` : ''}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(day.date, 'MMM d')} · {activities.length} activities
            {totalCost > 0 && ` · ~$${totalCost.toLocaleString()}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onFillGaps}>Fill</Button>
          <DayOrderToggle ordered={day.ordered} onChange={(v) => onOrderChange?.(day.dayNumber, v)} />
        </div>
      </div>
      <ActivityList
        activities={activities}
        ordered={day.ordered}
        onAddActivity={onAddActivity}
        onRemove={onRemove}
        onSwap={onSwap}
        onBook={onBook}
        onKeep={onKeep}
      />
    </div>
  );
}
