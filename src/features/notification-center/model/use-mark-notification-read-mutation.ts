'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getAccessToken } from '@/entities/auth';
import { markNotificationRead } from '@/shared/api/notifications';

import { notificationQueries } from '../api/notification-center.queries';

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) =>
      markNotificationRead(await getAccessToken(), notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationQueries.lists() }),
    retry: false,
  });
}
