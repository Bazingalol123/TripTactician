/**
 * Banner — full-width status strip (e.g. conflict warning, trip ready)
 * @param {'conflict'|'success'|'neutral'|'info'} variant
 */
const VARIANTS = {
  conflict: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  neutral: 'bg-gray-50 border-gray-200 text-gray-700',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export default function Banner({ variant = 'neutral', children, className = '' }) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${VARIANTS[variant]} ${className}`}>
      {children}
    </div>
  );
}
