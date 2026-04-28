import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getActivities,
  addActivity,
  updateActivity,
  removeActivity,
  reorderActivities,
  fillGaps,
} from '../services/activityService.js';
import { queryKeys } from '../constants/queryKeys.js';

export const useActivities = (tripId) => {
  const queryClient = useQueryClient();
  const key = queryKeys.trips.activities(tripId);

  const query = useQuery({
    queryKey: key,
    queryFn: () => getActivities(tripId),
    enabled: !!tripId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const add = useMutation({ mutationFn: (data) => addActivity(tripId, data), onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ activityId, updates }) => updateActivity(tripId, activityId, updates),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (activityId) => removeActivity(tripId, activityId),
    onSuccess: invalidate,
  });
  const reorder = useMutation({
    mutationFn: ({ dayNumber, orderedIds }) => reorderActivities(tripId, dayNumber, orderedIds),
    onSuccess: invalidate,
  });
  const fill = useMutation({
    mutationFn: (dayNumber) => fillGaps(tripId, dayNumber),
    onSuccess: invalidate,
  });

  return {
    activities: query.data ?? [],
    isLoading: query.isLoading,
    add,
    update,
    remove,
    reorder,
    fill,
  };
};
