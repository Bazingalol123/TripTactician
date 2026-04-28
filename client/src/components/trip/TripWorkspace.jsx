import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DayTabs from './DayTabs.jsx';
import DayPanel from './DayPanel.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import Avatar from '../ui/Avatar.jsx';
import TripMap from '../map/TripMap.jsx';
import FullscreenMap from '../map/FullscreenMap.jsx';
import BookingSheet from '../booking/BookingSheet.jsx';
import TripSettings from '../settings/TripSettings.jsx';
import { useActivities } from '../../hooks/useActivities.js';
import { useConflicts } from '../../hooks/useConflicts.js';
import { useBooking } from '../../hooks/useBooking.js';
import { useTrip } from '../../hooks/useTrip.js';
import { usePreferences } from '../../hooks/usePreferences.js';
import { getGenerationStatus } from '../../services/tripService.js';
import { formatDateRange } from '../../utils/dates.js';
import { queryKeys } from '../../constants/queryKeys.js';

export default function TripWorkspace({ tripId }) {
  const { trip, update } = useTrip(tripId);
  const { activities, add, remove, reorder, fill } = useActivities(tripId);
  const { conflictCount, conflicted } = useConflicts(activities);
  const { bookingActivity, openBooking, closeBooking } = useBooking();
  const { myPreferences } = usePreferences(tripId);
  const queryClient = useQueryClient();

  const [selectedDay, setSelectedDay] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(
    () => localStorage.getItem(`nudge-${tripId}`) === 'true'
  );

  const isGenerating = trip?.status === 'generating';
  const hasPreferences = !!myPreferences;

  // Poll generation status while trip is generating (RQ v5 — no onSuccess)
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

  const days = trip?.days ?? [];
  const currentDay = days.find((d) => d.dayNumber === selectedDay);
  const dayActivities = activities.filter((a) => a.dayNumber === selectedDay);

  const conflictDays = useMemo(() => {
    return new Set(conflicted.map((a) => a.dayNumber));
  }, [conflicted]);

  const handleOrderChange = (dayNumber, ordered) => {
    update.mutate({
      days: days.map((d) => d.dayNumber === dayNumber ? { ...d, ordered } : d),
    });
  };

  if (!trip) return <div className="p-8 text-gray-400 text-sm">Loading…</div>;

  return (
    <div className="flex flex-col h-screen">
      {/* Topbar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-900">← My trips</Link>
          <div>
            <h1 className="font-semibold text-gray-900 text-sm">{trip.name}</h1>
            <p className="text-xs text-gray-400">{formatDateRange(trip.startDate, trip.endDate)}</p>
          </div>
          <div className="flex gap-1">
            {trip.participants.map((p, i) => (
              <Avatar key={i} name={p.userId?.name} size="sm" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conflictCount > 0 && (
            <Badge variant="conflict">{conflictCount} conflicts</Badge>
          )}
          <Link to={`/trips/${tripId}/expenses`} className="text-sm text-gray-500 hover:text-gray-900">
            Expenses ↗
          </Link>
          <button
            onClick={() => setInviteOpen(true)}
            className="text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50"
          >
            + Invite partner
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5"
          >
            Settings
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Left: day list — gap 1 fix: w-96 (384px) so activity names don't truncate */}
        <div className="w-96 shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-y-auto">
          <div className="px-3 pt-3">
            <DayTabs
              days={days}
              selectedDay={selectedDay}
              onSelect={setSelectedDay}
              conflictDays={conflictDays}
            />
          </div>
          <div className="px-3 py-4 flex-1">
            {currentDay && (
              <DayPanel
                day={currentDay}
                activities={dayActivities}
                isGenerating={isGenerating}
                onOrderChange={handleOrderChange}
                onAddActivity={() => {}}
                onRemove={(id) => remove.mutate(id)}
                onSwap={(activity) => {}}
                onBook={openBooking}
                onKeep={(id) => {}}
                onFillGaps={() => fill.mutate(selectedDay)}
              />
            )}
          </div>

          {/* Personalize nudge — shown once after generation, dismissed permanently */}
          {!isGenerating && !hasPreferences && !nudgeDismissed && (
            <div className="mx-3 mb-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-blue-900">💡 Make this trip yours</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Tell us what you like and we'll tune the suggestions.
                  </p>
                </div>
                <button
                  onClick={() => {
                    localStorage.setItem(`nudge-${tripId}`, 'true');
                    setNudgeDismissed(true);
                  }}
                  className="text-blue-300 hover:text-blue-500 text-sm shrink-0"
                >✕</button>
              </div>
              <button
                onClick={() => setPersonalizeOpen(true)}
                className="mt-2 text-xs font-medium text-blue-700 hover:underline"
              >
                Set preferences →
              </button>
            </div>
          )}
        </div>

        {/* Right: map */}
        <div className="flex-1 relative">
          <TripMap
            activities={dayActivities}
            ordered={currentDay?.ordered ?? false}
            selectedActivity={selectedActivity}
            onPinSelect={setSelectedActivity}
            onFullscreenToggle={() => setFullscreen(true)}
          />
        </div>
      </div>

      {fullscreen && (
        <FullscreenMap
          trip={trip}
          activities={activities}
          selectedDay={selectedDay}
          onDaySelect={setSelectedDay}
          onClose={() => setFullscreen(false)}
        />
      )}

      <BookingSheet
        activity={bookingActivity}
        date={currentDay?.date}
        onClose={closeBooking}
      />

      {settingsOpen && (
        <TripSettings tripId={tripId} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
