'use client';

import { useMutation } from '@tanstack/react-query';

import { getAccessToken } from '@/entities/auth';
import { deletePushToken, type PushTokenPayload } from '@/shared/api/push-tokens';

export function useDeletePushTokenMutation() {
  return useMutation({
    mutationFn: async (payload: PushTokenPayload) =>
      deletePushToken(await getAccessToken(), payload),
    retry: false,
  });
}
