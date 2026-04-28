import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markRead, markAllRead } from '../services/notificationService.js';
import { queryKeys } from '../constants/queryKeys.js';

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: getNotifications,
    refetchInterval: 30000,
  });

  const read = useMutation({
    mutationFn: markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });

  const readAll = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });

  const unreadCount = (query.data ?? []).filter((n) => !n.read).length;

  return {
    notifications: query.data ?? [],
    unreadCount,
    isLoading: query.isLoading,
    markRead: read,
    markAllRead: readAll,
  };
};
