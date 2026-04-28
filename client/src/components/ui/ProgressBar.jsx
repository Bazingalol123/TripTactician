/**
 * ProgressBar — step progress indicator
 * @param {number} value - 0 to 100
 * @param {string} label - optional accessible label
 */
export default function ProgressBar({ value = 0, label, className = '' }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={`w-full ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
