import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTrip } from '../../hooks/useTrip.js';
import { useActivities } from '../../hooks/useActivities.js';
import { useConflicts } from '../../hooks/useConflicts.js';
import { usePreferences } from '../../hooks/usePreferences.js';
import { getGenerationStatus } from '../../services/tripService.js';
import { queryKeys } from '../../constants/queryKeys.js';
import TripSubPanel from './TripSubPanel.jsx';
import GuideActivityCard from './GuideActivityCard.jsx';
import PlaceDetailPanel from './PlaceDetailPanel.jsx';
import SwapCarousel from './SwapCarousel.jsx';
import TripMap from '../map/TripMap.jsx';
import DayPanel from './DayPanel.jsx';
import InviteModal from './InviteModal.jsx';
import PersonalizePanel from './PersonalizePanel.jsx';
import TripSettings from '../settings/TripSettings.jsx';
import { Edit3, Map } from 'lucide-react';

const TIME_SLOTS = ['morning', 'afternoon', 'evening'];

export default function TripGuide({ tripId }) {
  const queryClient = useQueryClient();
  const { trip, update: tripUpdate } = useTrip(tripId);
  const { activities, update: activityUpdate, remove: removeActivity, fill: fillGaps } = useActivities(tripId);
  const { conflictCount } = useConflicts(activities);
  const { myPreferences } = usePreferences(tripId);

  const [selectedDay, setSelectedDay] = useState(1);
  const [viewMode, setViewMode] = useState('guide');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [swapActivity, setSwapActivity] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(
    () => localStorage.getItem(`nudge-${tripId}`) === 'true'
  );

  const isGenerating = trip?.status === 'generating';
  const hasPreferences = !!myPreferences;
  const candidates = trip?.candidates || [];

  const genStatusQuery = useQuery({
    queryKey: ['gen-status', tripId],
    queryFn: () => getGenerationStatus(tripId),
    enabled: isGenerating,
    refetchInterval: (query) =>
      query.state.data?.status === 'active' ? false : 3000,
  });

  useEffect(() => {
    if (genStatusQuery.data?.status === 'active') {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(tripId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.activities(tripId) });
    }
  }, [genStatusQuery.data?.status]);

  if (!trip) return null;

  const currentDay = trip.days?.find(d => d.dayNumber === selectedDay);
  const dayActivities = activities.filter(a => a.dayNumber === selectedDay);
  const dayConflicts = dayActivities.filter(a => a.conflict?.flagged && !a.conflict?.overridden);

  const handleKeep = (activity) => {
    activityUpdate.mutate({
      activityId: activity._id,
      updates: { conflict: { ...activity.conflict, overridden: true } },
    });
  };

  const isScrollable = isGenerating || viewMode === 'guide';

  return (
    <div className="flex h-full overflow-hidden">
      <TripSubPanel
        tripId={tripId}
        selectedDay={selectedDay}
        onDaySelect={setSelectedDay}
        onClose={() => {}}
        onOpenMap={() => setViewMode('map')}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className={`flex-1 flex flex-col ${isScrollable ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        {/* Sticky header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-4 z-10 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isGenerating
                  ? 'Building your trip…'
                  : currentDay
                    ? `Day ${currentDay.dayNumber} — ${currentDay.label || 'Untitled'}`
                    : 'Your trip'
                }
              </h1>
              {!isGenerating && (
                <p className="text-sm text-gray-400 mt-0.5">
                  {trip.name}
                  {currentDay?.date
                    ? ` · ${new Date(currentDay.date).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric',
                      })}`
                    : ''
                  }
                  {dayActivities.length > 0 && ` · ${dayActivities.length} activities`}
                </p>
              )}
            </div>
            {!isGenerating && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInviteOpen(true)}
                  className="text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
                >
                  + Invite partner
                </button>
                <button
                  onClick={() => setViewMode(viewMode === 'edit' ? 'guide' : 'edit')}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Edit3 size={14} />
                  {viewMode === 'edit' ? 'Done editing' : 'Edit day'}
                </button>
                <button
                  onClick={() => setViewMode(viewMode === 'map' ? 'guide' : 'map')}
                  className="flex items-center gap-1.5 text-sm bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700 transition-colors"
                >
                  <Map size={14} />
                  {viewMode === 'map' ? 'Back to guide' : 'Open map'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Generation skeleton */}
        {isGenerating && (
          <div className="px-8 py-6 max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-500 text-lg">✦</span>
              <p className="text-base font-medium text-gray-700">
                Finding places and building your itinerary…
              </p>
            </div>
            <p className="text-sm text-gray-400 mb-6">This usually takes about a minute.</p>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-24 bg-gray-100 rounded-2xl animate-pulse mb-4"
                style={{ opacity: 1 - i * 0.2 }}
              />
            ))}
          </div>
        )}

        {/* Guide mode */}
        {!isGenerating && viewMode === 'guide' && (
          <div className="px-8 py-6 max-w-3xl w-full">
            {dayConflicts.length > 0 && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-amber-500">⚠</span>
                  <p className="text-sm text-amber-800">
                    <span className="font-medium">
                      {dayConflicts.length} conflict{dayConflicts.length > 1 ? 's' : ''} on this day
                    </span>
                    {' — '}preferences aren't fully matched.
                  </p>
                </div>
              </div>
            )}

            {dayActivities.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                <p className="text-gray-400 text-sm mb-3">Nothing planned for this day yet</p>
                <button
                  onClick={() => setViewMode('edit')}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Add activities →
                </button>
              </div>
            ) : (
              <>
                {/* Activities grouped by time of day */}
                {[...TIME_SLOTS, null].map(timeSlot => {
                  const slotActivities = dayActivities.filter(a =>
                    timeSlot === null
                      ? !TIME_SLOTS.includes(a.timeOfDay)
                      : a.timeOfDay === timeSlot
                  );
                  if (slotActivities.length === 0) return null;

                  return (
                    <div key={timeSlot || 'other'} className="mb-8">
                      {timeSlot && (
                        <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-3">
                          {timeSlot}
                        </p>
                      )}
                      <div className="flex flex-col gap-3">
                        {slotActivities.map(activity => (
                          <GuideActivityCard
                            key={activity._id}
                            activity={activity}
                            onViewOnMap={() => setViewMode('map')}
                            onSwap={() => setSwapActivity(activity)}
                            onKeep={() => handleKeep(activity)}
                            onClick={() => setSelectedActivity(activity)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Personalize nudge */}
            {!hasPreferences && !nudgeDismissed && (
              <div className="mt-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">💡 Make this trip yours</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      Tell us what you like and we'll tune the suggestions.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.setItem(`nudge-${tripId}`, 'true');
                      setNudgeDismissed(true);
                    }}
                    className="text-blue-300 hover:text-blue-500 text-sm ml-2 shrink-0"
                  >
                    ✕
                  </button>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setPersonalizeOpen(true); }}
                  className="mt-2 text-xs text-blue-700 font-medium hover:underline"
                >
                  Set preferences →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Edit mode */}
        {!isGenerating && viewMode === 'edit' && (
          <div className="flex-1 min-h-0 flex gap-4 p-6">
            <div className="w-96 shrink-0 overflow-y-auto">
              <DayPanel
                day={currentDay}
                activities={dayActivities}
                isGenerating={false}
                onOrderChange={(dayNumber, ordered) => {
                  tripUpdate.mutate({
                    days: trip.days.map(d =>
                      d.dayNumber === dayNumber ? { ...d, ordered } : d
                    ),
                  });
                }}
                onAddActivity={() => {}}
                onRemove={(id) => removeActivity.mutate(id)}
                onSwap={(activity) => setSwapActivity(activity)}
                onBook={() => {}}
                onKeep={(id) => {}}
                onFillGaps={() => fillGaps.mutate(selectedDay)}
              />
            </div>
            <div className="flex-1 min-w-0 rounded-2xl overflow-hidden border border-gray-200">
              <TripMap
                activities={dayActivities}
                ordered={currentDay?.ordered ?? false}
                onPinSelect={(activity) => setSelectedActivity(activity)}
                selectedActivity={null}
                fullscreen={false}
                onFullscreenToggle={() => {}}
              />
            </div>
          </div>
        )}

        {/* Map mode */}
        {!isGenerating && viewMode === 'map' && (
          <div className="flex-1 min-h-0 p-4">
            <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-200">
              <TripMap
                activities={dayActivities}
                ordered={currentDay?.ordered ?? false}
                onPinSelect={(activity) => setSelectedActivity(activity)}
                selectedActivity={null}
                fullscreen={false}
                onFullscreenToggle={() => {}}
              />
            </div>
          </div>
        )}
      </div>

      <PlaceDetailPanel
        activity={selectedActivity}
        tripId={tripId}
        onClose={() => setSelectedActivity(null)}
        onSwap={() => {
          setSwapActivity(selectedActivity);
          setSelectedActivity(null);
        }}
      />

      {swapActivity && (
        <SwapCarousel
          activity={swapActivity}
          tripId={tripId}
          candidates={candidates}
          onClose={() => setSwapActivity(null)}
        />
      )}

      {inviteOpen && (
        <InviteModal tripId={tripId} onClose={() => setInviteOpen(false)} />
      )}

      {personalizeOpen && (
        <PersonalizePanel tripId={tripId} onClose={() => setPersonalizeOpen(false)} />
      )}

      {settingsOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-start justify-end"
          onClick={e => { if (e.target === e.currentTarget) setSettingsOpen(false); }}
        >
          <div className="bg-white h-full w-96 shadow-xl overflow-y-auto">
            <TripSettings tripId={tripId} onClose={() => setSettingsOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

