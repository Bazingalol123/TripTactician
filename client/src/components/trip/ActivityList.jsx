import ActivityCard from './ActivityCard.jsx';
import Button from '../ui/Button.jsx';

export default function ActivityList({
  activities = [],
  ordered,
  onAddActivity,
  onRemove,
  onSwap,
  onBook,
  onKeep,
}) {
  if (activities.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        <p>No activities yet</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={onAddActivity}>
          + Add activity
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {activities.map((activity) => (
        <ActivityCard
          key={activity._id}
          activity={activity}
          ordered={ordered}
          onRemove={() => onRemove?.(activity._id)}
          onSwap={() => onSwap?.(activity)}
          onBook={() => onBook?.(activity)}
          onKeep={() => onKeep?.(activity._id)}
        />
      ))}
      <Button variant="ghost" size="sm" className="mt-1 self-start" onClick={onAddActivity}>
        + Add activity
      </Button>
    </div>
  );
}
