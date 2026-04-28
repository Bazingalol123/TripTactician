/**
 * Sheet — bottom sheet overlay
 * @param {boolean} open
 * @param {function} onClose
 * @param {'conflict'|'default'} variant
 */
export default function Sheet({ open, onClose, variant = 'default', children }) {
  if (!open) return null;

  const borderColor = variant === 'conflict' ? 'border-t-2 border-red-300' : '';
  const bg = variant === 'conflict' ? 'bg-red-50' : 'bg-white';

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative rounded-t-2xl shadow-xl ${bg} ${borderColor} max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-center pt-3 pb-1">
          <div className={`w-10 h-1 rounded-full ${variant === 'conflict' ? 'bg-red-300' : 'bg-gray-300'}`} />
        </div>
        <div className="px-4 pb-8">{children}</div>
      </div>
    </div>
  );
}
