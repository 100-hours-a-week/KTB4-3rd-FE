'use client';

import { useMutation } from '@tanstack/react-query';

import { getAccessToken } from '@/entities/auth';
import {
  registerOwnedCar,
  type OwnedCarRegistrationPayload,
  type OwnedCarRegistrationResponse,
} from '@/entities/owned-car';

export const ownedCarRegistrationMutationKeys = {
  register: () => ['users', 'me', 'cars', 'register'] as const,
};

export function useOwnedCarRegistrationMutation() {
  return useMutation<OwnedCarRegistrationResponse, Error, OwnedCarRegistrationPayload>({
    mutationKey: ownedCarRegistrationMutationKeys.register(),
    mutationFn: async (payload) => registerOwnedCar(await getAccessToken(), payload),
    retry: false,
    networkMode: 'always',
  });
}
