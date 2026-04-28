import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import PartnerRow from './PartnerRow.jsx';
import PreferencesReadOnly from './PreferencesReadOnly.jsx';
import { useTrip } from '../../hooks/useTrip.js';
import { usePreferences } from '../../hooks/usePreferences.js';
import { useAuth } from '../../hooks/useAuth.js';

export default function TripSettings({ tripId, onClose }) {
  const { trip, update, remove } = useTrip(tripId);
  const { myPreferences, partnerPreferences } = usePreferences(tripId);
  const { user } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!trip) return null;

  const myParticipant = trip.participants.find((p) => p.userId?._id === user?.id || p.userId === user?.id);
  const partnerParticipant = trip.participants.find((p) => p.userId?._id !== user?.id && p.userId !== user?.id);

  return (
    <div className="flex flex-col gap-6 p-4 max-w-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Trip settings</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </div>

      <section>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Partners</p>
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 px-4">
          {myParticipant && (
            <PartnerRow participant={myParticipant} isMe hasPreferences={!!myPreferences} />
          )}
          {partnerParticipant && (
            <PartnerRow participant={partnerParticipant} isMe={false} hasPreferences={!!partnerPreferences} />
          )}
        </div>
      </section>

      <section>
        <PreferencesReadOnly preferences={myPreferences} label="Your preferences" />
      </section>

      {partnerPreferences && (
        <section>
          <PreferencesReadOnly preferences={partnerPreferences} label="Partner's preferences" />
        </section>
      )}

      <section className="border-t border-gray-200 pt-4">
        {confirmDelete ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-red-600">This will permanently delete the trip and all activities.</p>
            <div className="flex gap-2">
              <Button variant="danger" size="sm" onClick={() => remove.mutate()}>Yes, delete</Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setConfirmDelete(true)}>
            Delete trip
          </Button>
        )}
      </section>
    </div>
  );
}
