import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTrip, updateTrip, deleteTrip } from '../services/tripService.js';
import { queryKeys } from '../constants/queryKeys.js';

export const useTrip = (tripId) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.trips.detail(tripId),
    queryFn: () => getTrip(tripId),
    enabled: !!tripId,
  });

  const update = useMutation({
    mutationFn: (updates) => updateTrip(tripId, updates),
    onSuccess: (trip) => queryClient.setQueryData(queryKeys.trips.detail(tripId), trip),
  });

  const remove = useMutation({
    mutationFn: () => deleteTrip(tripId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.trips.detail(tripId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
  });

  return { trip: query.data, isLoading: query.isLoading, error: query.error, update, remove };
};
