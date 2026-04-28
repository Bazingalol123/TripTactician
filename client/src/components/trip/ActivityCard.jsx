import { useState } from 'react';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import { formatPriceLevel } from '../../utils/currency.js';
import { formatConflictReason } from '../../utils/conflicts.js';

export default function ActivityCard({ activity, ordered, onRemove, onSwap, onBook, onKeep }) {
  const [expanded, setExpanded] = useState(false);
  const conflict = activity.conflict?.flagged && !activity.conflict?.overridden;
  const borderClass = conflict ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white';

  return (
    <div className={`rounded-xl border ${borderClass} overflow-hidden`}>
      {expanded ? (
        <ExpandedView
          activity={activity}
          conflict={conflict}
          onCollapse={() => setExpanded(false)}
          onRemove={onRemove}
          onSwap={onSwap}
          onBook={onBook}
          onKeep={onKeep}
        />
      ) : (
        <CompactView
          activity={activity}
          ordered={ordered}
          conflict={conflict}
          onExpand={() => setExpanded(true)}
          onRemove={onRemove}
          onSwap={onSwap}
          onBook={onBook}
          onKeep={onKeep}
        />
      )}
    </div>
  );
}

function CompactView({ activity, ordered, conflict, onExpand, onRemove, onSwap, onBook, onKeep }) {
  const photo = activity.photos?.[0];
  const conflictReason = formatConflictReason(activity.conflict);

  return (
    <div className="flex items-start gap-3 p-3">
      {ordered && (
        <span className="shrink-0 text-gray-400 mt-1 cursor-grab" title="Drag to reorder">⠿</span>
      )}
      <div className="shrink-0">
        {ordered ? (
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
            ${conflict ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'}`}>
            {activity.order ?? '?'}
          </span>
        ) : (
          <span className={`inline-block w-3 h-3 rounded-full mt-1.5
            ${conflict ? 'bg-red-400' : 'bg-gray-400'}`} />
        )}
      </div>
      {photo && (
        <img
          src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=60&photo_reference=${photo}&key=`}
          alt=""
          className="w-14 h-14 rounded-lg object-cover shrink-0 bg-gray-100"
          onClick={onExpand}
        />
      )}
      <div className="flex-1 min-w-0" onClick={onExpand}>
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm text-gray-900 truncate">{activity.name}</p>
          {activity.addedBy && (
            <Badge variant="neutral" className="shrink-0">Added</Badge>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {activity.category} · {formatPriceLevel(activity.priceLevel)}
        </p>
        {conflict && conflictReason && (
          <div className="mt-1 flex items-center gap-1 text-xs text-red-700">
            <span>⚠</span> {conflictReason}
          </div>
        )}
      </div>
      <div className="flex gap-1.5 shrink-0">
        <Button variant="ghost" size="sm" onClick={onSwap}>Swap</Button>
        <Button variant="ghost" size="sm" onClick={onRemove}>Remove</Button>
        {conflict
          ? <Button variant="secondary" size="sm" onClick={onKeep}>Keep</Button>
          : <Button variant="primary" size="sm" onClick={onBook}>Book</Button>}
      </div>
    </div>
  );
}

function ExpandedView({ activity, conflict, onCollapse, onRemove, onSwap, onBook, onKeep }) {
  const photo = activity.photos?.[0];
  const conflictReason = formatConflictReason(activity.conflict);

  return (
    <div>
      {photo && (
        <div className="relative">
          <img
            src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo}&key=`}
            alt=""
            className="w-full h-32 object-cover bg-gray-100"
          />
          <button
            onClick={onCollapse}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{activity.name}</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {activity.category} · {activity.rating ? `${activity.rating}★` : ''}
        </p>
        {conflict && conflictReason && (
          <div className="mt-2 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">
            ⚠ {conflictReason}
          </div>
        )}
        <div className="mt-3 rounded-lg border border-gray-100 divide-y divide-gray-100 text-sm">
          {activity.estimatedCostPerPerson != null && (
            <Row label="Est. cost" value={formatPriceLevel(activity.priceLevel)} />
          )}
          {activity.timeOfDay && (
            <Row label="Time of day" value={activity.timeOfDay} />
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" size="sm" onClick={onSwap}>Swap</Button>
          <Button variant="secondary" size="sm" onClick={onRemove}>Remove</Button>
          {conflict
            ? <Button variant="primary" size="sm" onClick={onKeep}>Keep anyway</Button>
            : <Button variant="primary" size="sm" onClick={onBook}>Book →</Button>}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between px-3 py-2">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}
