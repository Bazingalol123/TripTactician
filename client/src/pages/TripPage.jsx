import { useParams } from 'react-router-dom';
import TripGuide from '../components/trip/TripGuide.jsx';
import { useTrip } from '../hooks/useTrip.js';

export default function TripPage() {
  const { id } = useParams();
  const { trip, isLoading } = useTrip(id);

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-400 text-sm">Loading…</p>
    </div>
  );

  if (!trip) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-red-500 text-sm">Trip not found</p>
    </div>
  );

  return <TripGuide tripId={id} />;
}
