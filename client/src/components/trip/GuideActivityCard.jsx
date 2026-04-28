import { ExternalLink, MapPin } from 'lucide-react';

export const CATEGORY_CONFIG = {
  food:           { emoji: '🍜', bg: 'bg-amber-50',  border: 'border-amber-100' },
  restaurant:     { emoji: '🍜', bg: 'bg-amber-50',  border: 'border-amber-100' },
  cafe:           { emoji: '☕', bg: 'bg-amber-50',  border: 'border-amber-100' },
  culture:        { emoji: '🏛',  bg: 'bg-blue-50',   border: 'border-blue-100' },
  museum:         { emoji: '🏛',  bg: 'bg-blue-50',   border: 'border-blue-100' },
  attraction:     { emoji: '🗺',  bg: 'bg-teal-50',   border: 'border-teal-100' },
  nature:         { emoji: '🌿', bg: 'bg-green-50',  border: 'border-green-100' },
  park:           { emoji: '🌿', bg: 'bg-green-50',  border: 'border-green-100' },
  shopping:       { emoji: '🛍', bg: 'bg-purple-50', border: 'border-purple-100' },
  adventure:      { emoji: '🧗', bg: 'bg-orange-50', border: 'border-orange-100' },
  transportation: { emoji: '🚇', bg: 'bg-gray-100',  border: 'border-gray-200' },
  sightseeing:    { emoji: '🗺', bg: 'bg-teal-50',   border: 'border-teal-100' },
  wellness:       { emoji: '🧘', bg: 'bg-pink-50',   border: 'border-pink-100' },
  nightlife:      { emoji: '🎶', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  default:        { emoji: '📍', bg: 'bg-gray-50',   border: 'border-gray-200' },
};

export const getCategoryConfig = (category) => {
  if (!category) return CATEGORY_CONFIG.default;
  return CATEGORY_CONFIG[category]
    || CATEGORY_CONFIG[category.toLowerCase()]
    || CATEGORY_CONFIG.default;
};

export default function GuideActivityCard({
  activity,
  onViewOnMap,
  onSwap,
  onKeep,
  onRemove,
  onClick,
}) {
  const isConflict = activity.conflict?.flagged && !activity.conflict?.overridden;
  const cat = getCategoryConfig(activity.category);

  return (
    <div
      className={`
        rounded-2xl border bg-white transition-all cursor-pointer
        hover:shadow-md hover:border-gray-300
        ${isConflict
          ? 'border-amber-300 bg-amber-50/40'
          : 'border-gray-200 shadow-sm'
        }
      `}
      onClick={onClick}
    >
      <div className="flex gap-4 p-4">
        <div className={`
          w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0
          ${cat.bg} ${cat.border} border
        `}>
          {cat.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-base font-semibold text-gray-900 leading-tight">
                {activity.name}
              </p>
              <p className="text-sm text-gray-400 mt-0.5">
                {activity.category}
                {activity.estimatedCostPerPerson > 0
                  ? ` · ~$${activity.estimatedCostPerPerson}pp`
                  : ' · Free'}
                {activity.timeOfDay ? ` · ${activity.timeOfDay}` : ''}
              </p>
            </div>

            {activity.website && (
              <a
                href={activity.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0 mt-0.5"
              >
                Book <ExternalLink size={11} />
              </a>
            )}
          </div>

          {activity.description && (
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              {activity.description}
            </p>
          )}

          {isConflict && (
            <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start justify-between gap-3">
              <p className="text-xs text-amber-800">
                ⚠ {activity.conflict.reason || 'Conflicts with partner preferences'}
              </p>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onSwap?.(); }}
                  className="text-xs border border-amber-300 text-amber-700 rounded-md px-2 py-0.5 hover:bg-amber-100 transition-colors"
                >
                  Swap
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onKeep?.(); }}
                  className="text-xs text-amber-600 hover:text-amber-800"
                >
                  Keep anyway
                </button>
              </div>
            </div>
          )}

          {activity.coords && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewOnMap?.(); }}
              className="mt-2.5 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
            >
              <MapPin size={11} />
              View on map ↗
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
