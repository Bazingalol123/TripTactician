import Toggle from '../ui/Toggle.jsx';

const OPTIONS = [
  { value: 'ordered', label: 'Ordered' },
  { value: 'unordered', label: 'Unordered' },
];

export default function DayOrderToggle({ ordered, onChange }) {
  return (
    <Toggle
      options={OPTIONS}
      value={ordered ? 'ordered' : 'unordered'}
      onChange={(v) => onChange(v === 'ordered')}
    />
  );
}
