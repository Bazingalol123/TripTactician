import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTrips } from '../services/tripService.js';
import { queryKeys } from '../constants/queryKeys.js';
import { formatDateRange, daysUntil } from '../utils/dates.js';
import { Plus } from 'lucide-react';
import CreateTripModal from '../components/trip/CreateTripModal.jsx';

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
        <h2 className="text-sm font-semibold text-gray-900">My trips</h2>
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
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {heroTrip && (
          <button
            onClick={() => navigate(`/trips/${heroTrip._id}`)}
            className="w-full text-left bg-blue-50 border border-blue-100 rounded-xl p-3 hover:bg-blue-100 transition-colors"
          >
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
          </button>
        )}

        {heroTrip && otherTrips.length > 0 && (
          <div className="border-t border-gray-100 my-1" />
        )}

        {otherTrips.map(trip => (
          <button
            key={trip._id}
            onClick={() => navigate(`/trips/${trip._id}`)}
            className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{trip.name}</p>
              <p className="text-xs text-gray-400 truncate">
                {formatDateRange(trip.startDate, trip.endDate)}
              </p>
            </div>
            <StatusBadge status={trip.status} />
          </button>
        ))}

        {!isLoading && trips.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✈️</span>
            </div>
            <p className="text-sm text-gray-500 mb-1">No trips yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Plan your first trip →
            </button>
          </div>
        )}
      </div>

      {showCreate && <CreateTripModal onClose={() => setShowCreate(false)} />}
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
