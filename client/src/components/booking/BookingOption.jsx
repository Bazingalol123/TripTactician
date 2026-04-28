import { openDeepLink } from '../../utils/booking.js';

/**
 * BookingOption — single provider button row
 * @param {'primary'|'secondary'|'tertiary'} rank
 */
export default function BookingOption({ link, rank = 'secondary' }) {
  const primary = rank === 'primary';
  return (
    <button
      onClick={() => openDeepLink(link.url)}
      className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors
        ${primary
          ? 'border-blue-400 bg-blue-50 hover:bg-blue-100'
          : 'border-gray-200 bg-white hover:bg-gray-50'}`}
    >
      <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
        {link.provider[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${primary ? 'text-blue-700' : 'text-gray-800'}`}>
          {link.label}
        </p>
        {link.subtitle && (
          <p className="text-xs text-gray-400 truncate">{link.subtitle}</p>
        )}
      </div>
      <span className={`text-sm ${primary ? 'text-blue-500' : 'text-gray-400'}`}>↗</span>
    </button>
  );
}
