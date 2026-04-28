import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  setPreferences,
  getMyPreferences,
  getPartnerPreferences,
} from '../services/tripService.js';
import { queryKeys } from '../constants/queryKeys.js';

export const usePreferences = (tripId) => {
  const queryClient = useQueryClient();

  const mine = useQuery({
    queryKey: queryKeys.preferences.mine(tripId),
    queryFn: () => getMyPreferences(tripId),
    enabled: !!tripId,
    retry: false,
  });

  const partner = useQuery({
    queryKey: queryKeys.preferences.partner(tripId),
    queryFn: () => getPartnerPreferences(tripId),
    enabled: !!tripId,
    retry: false,
  });

  const save = useMutation({
    mutationFn: (prefs) => setPreferences(tripId, prefs),
    onSuccess: (preference) =>
      queryClient.setQueryData(queryKeys.preferences.mine(tripId), preference),
  });

  return {
    myPreferences: mine.data,
    partnerPreferences: partner.data,
    isLoadingMine: mine.isLoading,
    isLoadingPartner: partner.isLoading,
    save,
  };
};
