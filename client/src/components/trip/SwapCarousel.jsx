import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '../../services/api.js';
import { queryKeys } from '../../constants/queryKeys.js';
import { getCategoryConfig } from './GuideActivityCard.jsx';

export default function SwapCarousel({ activity, tripId, candidates = [], onClose }) {
  const queryClient = useQueryClient();
  const [idx, setIdx] = useState(0);

  // Hooks before early return
  const swapMutation = useMutation({
    mutationFn: (candidate) => api.patch(`/trips/${tripId}/activities/${activity._id}`, {
      placeId: candidate.placeId,
      name: candidate.name,
      category: candidate.category,
      priceLevel: candidate.priceLevel,
      estimatedCostPerPerson: candidate.estimatedCostPerPerson,
      rating: candidate.rating,
      coords: candidate.coords,
      website: candidate.website,
      bookingType: candidate.bookingType,
      conflict: { flagged: false, partner: null, reason: null, overridden: false },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.activities(tripId) });
      onClose();
    },
  });

  if (!activity) return null;

  const cat = getCategoryConfig(activity.category);

  const alternatives = candidates
    .filter(c => c.category === activity.category && c.placeId !== activity.placeId)
    .slice(0, 8);

  const current = alternatives[idx];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Swapping</p>
            <p className="text-sm font-semibold text-gray-900">{activity.name}</p>
            {activity.conflict?.reason && (
              <p className="text-xs text-amber-600 mt-0.5">⚠ {activity.conflict.reason}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
          >
            <X size={14} /> Cancel
          </button>
        </div>

        {alternatives.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 text-sm mb-1">No alternative places found for this category.</p>
            <p className="text-xs text-gray-400 mb-4">Try editing the day to search for specific places.</p>
            <button onClick={onClose} className="text-sm text-blue-600 hover:underline">
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="px-5 pt-3">
              <p className="text-xs text-gray-400">{idx + 1} of {alternatives.length}</p>
            </div>

            {/* Card */}
            <div className="flex gap-4 px-5 py-4">
              <div className={`
                w-32 h-32 rounded-xl flex items-center justify-center text-4xl
                shrink-0 ${cat.bg} ${cat.border} border
              `}>
                {cat.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
                  {current?.category}
                </p>
                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                  {current?.name}
                </h3>
                <div className="flex gap-4 text-sm text-gray-500 mb-3">
                  <span>
                    {current?.estimatedCostPerPerson > 0
                      ? `~$${current.estimatedCostPerPerson}pp`
                      : 'Free'}
                  </span>
                  {current?.rating && <span>★ {current.rating}</span>}
                </div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
                  Why we suggested this
                </p>
                <p className="text-sm text-gray-600">
                  Similar to {activity.name} and matches your travel profile.
                </p>
              </div>
            </div>

            {/* Navigation + actions */}
            <div className="px-5 pb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIdx(i => Math.max(0, i - 1))}
                  disabled={idx === 0}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-1">
                  {alternatives.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        i === idx ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setIdx(i => Math.min(alternatives.length - 1, i + 1))}
                  disabled={idx === alternatives.length - 1}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIdx(i => Math.min(alternatives.length - 1, i + 1))}
                  disabled={idx === alternatives.length - 1}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 disabled:opacity-30"
                >
                  Skip →
                </button>
                <button
                  onClick={() => swapMutation.mutate(current)}
                  disabled={swapMutation.isPending}
                  className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {swapMutation.isPending ? 'Swapping…' : 'Use this instead ↗'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
