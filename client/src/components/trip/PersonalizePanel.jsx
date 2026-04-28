import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { usePreferences } from '../../hooks/usePreferences.js';
import { triggerGeneration } from '../../services/tripService.js';
import { queryKeys } from '../../constants/queryKeys.js';
import PreferencesForm from '../onboarding/PreferencesForm.jsx';

export default function PersonalizePanel({ tripId, onClose }) {
  const queryClient = useQueryClient();
  const { save, myPreferences } = usePreferences(tripId);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (prefs) => {
    await save.mutateAsync(prefs);
    await triggerGeneration(tripId);
    queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(tripId) });
    setSaved(true);
    setTimeout(onClose, 1200);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col border-l border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Your preferences</h2>
            <p className="text-xs text-gray-400 mt-0.5">We'll tune the suggestions to match.</p>
          </div>
          <button onClick={onClose}>
            <X size={16} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {saved ? (
            <div className="text-center py-8">
              <p className="text-green-600 font-medium">✓ Saved</p>
              <p className="text-xs text-gray-400 mt-1">Regenerating your trip…</p>
            </div>
          ) : (
            <PreferencesForm
              initial={myPreferences}
              onSubmit={handleSubmit}
              submitLabel="Save and regenerate →"
              loading={save.isPending}
            />
          )}
        </div>
      </div>
    </>
  );
}
