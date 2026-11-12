'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getAccessToken } from '@/entities/auth';
import {
  markAllNotificationsRead,
  type MarkAllNotificationsReadRequest,
} from '@/shared/api/notifications';

import { notificationQueries } from '../api/notification-center.queries';

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: MarkAllNotificationsReadRequest) =>
      markAllNotificationsRead(await getAccessToken(), payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationQueries.lists() }),
    retry: false,
  });
}
