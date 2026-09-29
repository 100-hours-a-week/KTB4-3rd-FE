'use client';

import { useMutation } from '@tanstack/react-query';

import { refreshAccessToken, useAuthStore } from '@/entities/auth';
import { joinCompanionPost } from '@/features/join-companion/api/join-companion';

async function getAccessToken() {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    return accessToken;
  }

  const { data } = await refreshAccessToken();
  useAuthStore.getState().setAccessToken(data.access_token);

  return data.access_token;
}

export function useJoinCompanionMutation() {
  return useMutation({
    mutationFn: async (companionId: number) => {
      const accessToken = await getAccessToken();

      return joinCompanionPost(accessToken, companionId);
    },
  });
}
