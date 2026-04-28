/**
 * Badge — status indicator chip
 * @param {'conflict'|'waiting'|'success'|'neutral'} variant
 */
const VARIANTS = {
  conflict: 'bg-red-100 text-red-700 border border-red-200',
  waiting: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  success: 'bg-green-50 text-green-700 border border-green-200',
  neutral: 'bg-gray-100 text-gray-600 border border-gray-200',
};

export default function Badge({ variant = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
        ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
