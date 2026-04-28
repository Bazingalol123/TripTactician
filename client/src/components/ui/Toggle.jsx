/**
 * Toggle — single-select row of options (replaces radio group)
 * @param {Array<{value: string, label: string}>} options
 * @param {string} value - selected value
 * @param {function} onChange
 */
export default function Toggle({ options = [], value, onChange, className = '' }) {
  return (
    <div className={`inline-flex rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 text-sm font-medium transition-colors
            ${value === option.value
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'}
            not-first:border-l not-first:border-gray-200`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
