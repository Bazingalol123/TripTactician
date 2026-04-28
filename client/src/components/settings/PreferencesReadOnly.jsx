import Badge from '../ui/Badge.jsx';
import { INTERESTS } from '../../constants/interests.js';

export default function PreferencesReadOnly({ preferences, label = 'Preferences' }) {
  if (!preferences) return <p className="text-sm text-gray-400">Not set yet</p>;

  const interestLabels = preferences.interests
    ?.map((v) => INTERESTS.find((i) => i.value === v)?.label ?? v) ?? [];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="neutral">{preferences.pace}</Badge>
        {interestLabels.map((label) => (
          <Badge key={label} variant="neutral">{label}</Badge>
        ))}
        <Badge variant="neutral">{preferences.morningPerson ? 'Morning person' : 'Night owl'}</Badge>
      </div>
      {preferences.hardAvoids && (
        <p className="text-xs text-gray-400">Avoids: {preferences.hardAvoids}</p>
      )}
    </div>
  );
}
