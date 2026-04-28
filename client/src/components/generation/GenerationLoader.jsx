import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getGenerationStatus } from '../../services/tripService.js';

export default function GenerationLoader({ tripId }) {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['generation-status', tripId],
    queryFn: () => getGenerationStatus(tripId),
    refetchInterval: 3000,
    enabled: !!tripId,
  });

  useEffect(() => {
    if (data?.status === 'active') {
      navigate(`/trips/${tripId}`, { replace: true });
    }
  }, [data?.status, tripId, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        <div className="text-center">
          <h2 className="font-semibold text-gray-900">Building your trip</h2>
          <p className="text-sm text-gray-400 mt-1">Finding the best places for both of you…</p>
        </div>
      </div>
      <div className="w-full max-w-xs flex flex-col gap-2 text-sm text-gray-500">
        <Step label="Finding top-rated places" done />
        <Step label="Matching your preferences" done={data?.status !== 'generating'} />
        <Step label="Building day-by-day itinerary" done={data?.status === 'active'} />
      </div>
    </div>
  );
}

function Step({ label, done }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs
        ${done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
        {done ? '✓' : ''}
      </span>
      <span className={done ? 'text-gray-700' : 'text-gray-400'}>{label}</span>
    </div>
  );
}
