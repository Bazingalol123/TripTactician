import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getTrips } from '../services/tripService.js';
import { useAuth } from '../hooks/useAuth.js';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import CreateTripModal from '../components/trip/CreateTripModal.jsx';
import { formatDateRange } from '../utils/dates.js';
import { queryKeys } from '../constants/queryKeys.js';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const { data: trips = [], isLoading } = useQuery({
    queryKey: queryKeys.trips.all,
    queryFn: getTrips,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="font-semibold text-gray-900">TripTactician</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{user?.name}</span>
          <Button variant="ghost" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">My trips</h2>
          <Button size="sm" onClick={() => setShowCreate(true)}>+ New trip</Button>
        </div>

        {isLoading && <p className="text-sm text-gray-400">Loading…</p>}

        {!isLoading && trips.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">No trips yet</p>
            <Button onClick={() => setShowCreate(true)}>Plan your first trip</Button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {trips.map((trip) => (
            <Link key={trip._id} to={`/trips/${trip._id}`}>
              <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{trip.name}</p>
                    <p className="text-sm text-gray-500">{trip.destination?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDateRange(trip.startDate, trip.endDate)}
                    </p>
                  </div>
                  <Badge variant={statusVariant(trip.status)}>{statusLabel(trip.status)}</Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {showCreate && <CreateTripModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

const statusVariant = (status) => {
  if (status === 'active') return 'success';
  if (status === 'generating') return 'info';
  if (status === 'pending_partner') return 'waiting';
  return 'neutral';
};

const statusLabel = (status) => {
  if (status === 'active') return 'Ready';
  if (status === 'generating') return 'Building…';
  if (status === 'pending_partner') return 'Waiting for partner';
  if (status === 'solo') return 'Solo';
  if (status === 'archived') return 'Archived';
  return status;
};
