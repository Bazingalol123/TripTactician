import { X, ExternalLink, MapPin, RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api.js';
import { queryKeys } from '../../constants/queryKeys.js';
import { getCategoryConfig } from './GuideActivityCard.jsx';

export default function PlaceDetailPanel({ activity, tripId, onClose, onSwap }) {
  const queryClient = useQueryClient();

  // Hooks must be called unconditionally — early return comes after
  const keepMutation = useMutation({
    mutationFn: () => api.patch(`/trips/${tripId}/activities/${activity._id}`, {
      conflict: { ...activity.conflict, overridden: true },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.activities(tripId) });
      onClose();
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => api.delete(`/trips/${tripId}/activities/${activity._id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.activities(tripId) });
      onClose();
    },
  });

  if (!activity) return null;

  const cat = getCategoryConfig(activity.category);
  const isConflict = activity.conflict?.flagged && !activity.conflict?.overridden;

  return (
    <>
      <div className="fixed inset-0 bg-black/10 z-40" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col border-l border-gray-200 overflow-y-auto">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center z-10"
        >
          <X size={14} />
        </button>

        {/* Icon hero */}
        <div className={`${cat.bg} flex items-center justify-center h-36 shrink-0`}>
          <span className="text-5xl">{cat.emoji}</span>
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-1">
            {activity.category}
            {activity.estimatedCostPerPerson === 0 ? ' · Free' : ''}
          </p>

          <h2 className="text-xl font-bold text-gray-900 mb-1">{activity.name}</h2>

          <p className="text-sm text-gray-400 mb-4">
            {activity.rating ? `★ ${activity.rating}` : ''}
            {activity.timeOfDay ? `${activity.rating ? ' · ' : ''}Opens ${activity.timeOfDay}` : ''}
          </p>

          {activity.website ? (
            <a
              href={activity.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors mb-4"
            >
              Book <ExternalLink size={14} />
            </a>
          ) : (
            <div className="mb-4" />
          )}

          {activity.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{activity.description}</p>
          )}

          {isConflict && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-800 font-medium mb-1">Conflict</p>
              <p className="text-xs text-amber-700">{activity.conflict.reason}</p>
              <button
                onClick={() => keepMutation.mutate()}
                disabled={keepMutation.isPending}
                className="mt-2 text-xs text-amber-700 border border-amber-300 rounded-md px-2 py-1 hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                Keep anyway
              </button>
            </div>
          )}

          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 mb-4">
            {activity.estimatedCostPerPerson > 0 && (
              <DetailRow label="Est. cost" value={`~$${activity.estimatedCostPerPerson}pp`} />
            )}
            {activity.timeOfDay && (
              <DetailRow label="Time of day" value={activity.timeOfDay} />
            )}
            {activity.rating && (
              <DetailRow label="Rating" value={`★ ${activity.rating}`} />
            )}
            {activity.coords && (
              <DetailRow
                label="Location"
                value={
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${activity.coords.lat},${activity.coords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <MapPin size={11} /> View on map
                  </a>
                }
              />
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-100 p-4 flex gap-2 shrink-0">
          <button
            onClick={onSwap}
            className="flex-1 flex items-center justify-center gap-1.5 border border-blue-200 text-blue-600 rounded-xl py-2 text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            <RefreshCw size={13} /> Browse alternatives
          </button>
          <button
            onClick={() => removeMutation.mutate()}
            disabled={removeMutation.isPending}
            className="px-4 border border-red-200 text-red-500 rounded-xl py-2 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center px-3 py-2.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}
