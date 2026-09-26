'use client';

import { useMutation } from '@tanstack/react-query';

import { refreshAccessToken, useAuthStore } from '@/entities/auth';
import { startTaxiPotMatching } from '@/features/matching-registration/api/taxi-pots';
import type { MatchingRegistrationPayload } from './matching-registration-store';

async function getAccessToken() {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    return accessToken;
  }

  const { data } = await refreshAccessToken();
  useAuthStore.getState().setAccessToken(data.access_token);

  return data.access_token;
}

export function useTaxiPotMatchingMutation() {
  return useMutation({
    mutationFn: async (payload: MatchingRegistrationPayload) => {
      const accessToken = await getAccessToken();

      return startTaxiPotMatching(accessToken, payload);
    },
  });
}
