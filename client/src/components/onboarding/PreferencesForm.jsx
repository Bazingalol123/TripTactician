import { useState } from 'react';
import Toggle from '../ui/Toggle.jsx';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import { INTERESTS } from '../../constants/interests.js';

const PACE_OPTIONS = [
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'packed', label: 'Packed' },
];

const MORNING_OPTIONS = [
  { value: 'yes', label: 'Yes — early starts ok' },
  { value: 'no', label: 'No' },
];

export default function PreferencesForm({ initial = {}, onSubmit, submitLabel = 'Continue →', loading }) {
  const [pace, setPace] = useState(initial.pace || 'moderate');
  const [interests, setInterests] = useState(initial.interests || []);
  const [morningPerson, setMorningPerson] = useState(
    initial.morningPerson === undefined ? true : initial.morningPerson
  );
  const [hardAvoids, setHardAvoids] = useState(initial.hardAvoids || '');
  const [error, setError] = useState('');

  const toggleInterest = (value) => {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (interests.length === 0) { setError('Pick at least one interest'); return; }
    setError('');
    onSubmit?.({ pace, interests, morningPerson, hardAvoids: hardAvoids.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pace</p>
        <Toggle options={PACE_OPTIONS} value={pace} onChange={setPace} />
      </section>

      <section>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Interests</p>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <button
              key={i.value}
              type="button"
              onClick={() => toggleInterest(i.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                ${interests.includes(i.value)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
            >
              {i.label}
            </button>
          ))}
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </section>

      <section>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Morning person?</p>
        <Toggle
          options={MORNING_OPTIONS}
          value={morningPerson ? 'yes' : 'no'}
          onChange={(v) => setMorningPerson(v === 'yes')}
        />
      </section>

      <section>
        <Input
          label="Hard avoids"
          placeholder='e.g. "no museums"'
          value={hardAvoids}
          onChange={(e) => setHardAvoids(e.target.value)}
          hint="Anything you'd rather skip entirely"
        />
      </section>

      <Button type="submit" fullWidth loading={loading}>{submitLabel}</Button>
    </form>
  );
}
