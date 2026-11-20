'use client';

import { useMutation } from '@tanstack/react-query';

import { getAccessToken } from '@/entities/auth';
import { registerPushToken, type PushTokenPayload } from '@/shared/api/push-tokens';

export function useRegisterPushTokenMutation() {
  return useMutation({
    mutationFn: async (payload: PushTokenPayload) =>
      registerPushToken(await getAccessToken(), payload),
    retry: false,
  });
}
