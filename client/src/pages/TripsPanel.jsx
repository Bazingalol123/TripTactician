import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTrips } from '../services/tripService.js';
import { queryKeys } from '../constants/queryKeys.js';
import { formatDateRange, daysUntil } from '../utils/dates.js';
import { Plus } from 'lucide-react';
import CreateTripModal from '../components/trip/CreateTripModal.jsx';

const destPhotoSrc = (trip) =>
  trip.destination?.photoUrl ||
  (trip.destination?.name
    ? `https://source.unsplash.com/400x160/?${encodeURIComponent(trip.destination.name)},travel`
    : null);

export default function TripsPanel({ onClose }) {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  const { data: trips = [], isLoading } = useQuery({
    queryKey: queryKeys.trips.all,
    queryFn: getTrips,
  });

  const now = new Date();
  const upcomingTrips = trips
    .filter(t => t.status === 'active' && new Date(t.startDate) > now)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const heroTrip = upcomingTrips[0] || null;
  const otherTrips = trips.filter(t => t._id !== heroTrip?._id);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">My trips</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-sm leading-none"
            >
              ✕
            </button>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus size={14} />
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {isLoading && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {heroTrip && (
          <button
            onClick={() => navigate(`/trips/${heroTrip._id}`)}
            className="w-full text-left bg-white border border-blue-100 rounded-xl overflow-hidden hover:border-blue-200 transition-colors shadow-sm"
          >
            <PhotoStrip trip={heroTrip} height="h-20" />
            <div className="p-3 bg-blue-50">
              <p className="text-sm font-semibold text-gray-900 mb-0.5">{heroTrip.name}</p>
              <p className="text-xs text-gray-500 mb-1.5">
                {formatDateRange(heroTrip.startDate, heroTrip.endDate)}
                {' · '}
                <span className="text-blue-600 font-medium">
                  {(() => { const d = daysUntil(heroTrip.startDate); return `${d} ${d === 1 ? 'day' : 'days'} away`; })()}
                </span>
              </p>
              <HeroStatusLine trip={heroTrip} />
              <p className="text-xs text-blue-600 font-medium mt-2">Open →</p>
            </div>
          </button>
        )}

        {heroTrip && otherTrips.length > 0 && (
          <div className="border-t border-gray-100 my-1" />
        )}

        {otherTrips.map(trip => (
          <button
            key={trip._id}
            onClick={() => navigate(`/trips/${trip._id}`)}
            className="w-full text-left bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors shadow-sm"
          >
            <PhotoStrip trip={trip} height="h-20" />
            <div className="flex items-center justify-between px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{trip.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {formatDateRange(trip.startDate, trip.endDate)}
                </p>
              </div>
              <StatusBadge status={trip.status} />
            </div>
          </button>
        ))}

        {!isLoading && trips.length === 0 && (
          <div className="flex flex-col items-center px-2 pt-4">
            <div className="w-full rounded-xl overflow-hidden mb-4">
              <img
                src="https://source.unsplash.com/640x320/?honeymoon,travel,couple"
                alt="Start planning"
                className="w-full h-32 object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <h2 className="font-serif text-base font-medium text-gray-900 mb-1 text-center">
              Where are you two going?
            </h2>
            <p className="text-xs text-gray-500 text-center mb-4 leading-relaxed">
              Plan your honeymoon together — every decision, in sync.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
            >
              Plan your trip →
            </button>
          </div>
        )}
      </div>

      {showCreate && <CreateTripModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function PhotoStrip({ trip, height = 'h-20' }) {
  const src = destPhotoSrc(trip);
  return (
    <div className={`relative w-full ${height} bg-gray-100 overflow-hidden`}>
      {src && (
        <img
          src={src}
          alt={trip.destination?.name || ''}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}
      {trip.destination?.name && (
        <span className="absolute bottom-1.5 left-2 text-[10px] font-medium text-white bg-black/40 rounded px-1.5 py-0.5">
          {trip.destination.name}
        </span>
      )}
    </div>
  );
}

function HeroStatusLine({ trip }) {
  if (trip.status === 'pending_partner') {
    return <p className="text-xs text-amber-600">Waiting for partner to join</p>;
  }
  if (trip.participants?.length > 1) {
    return <p className="text-xs text-gray-500">Partner joined</p>;
  }
  return null;
}

function StatusBadge({ status }) {
  const config = {
    active:          { label: 'Ready',    className: 'text-green-600 bg-green-50' },
    generating:      { label: 'Building…', className: 'text-blue-600 bg-blue-50' },
    pending_partner: { label: 'Waiting',  className: 'text-amber-600 bg-amber-50' },
    solo:            { label: 'Solo',     className: 'text-gray-500 bg-gray-100' },
    archived:        { label: 'Archived', className: 'text-gray-400 bg-gray-100' },
  };
  const { label, className } = config[status] || { label: status, className: 'text-gray-400' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${className}`}>
      {label}
    </span>
  );
}
