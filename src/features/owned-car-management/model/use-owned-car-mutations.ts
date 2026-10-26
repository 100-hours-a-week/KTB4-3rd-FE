'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getAccessToken } from '@/entities/auth';
import {
  deleteOwnedCar,
  updateOwnedCar,
  type OwnedCarRegistrationPayload,
} from '@/entities/owned-car';

import { ownedCarQueries } from '../api/owned-car.queries'; // oxlint-disable-line import/no-relative-parent-imports -- 동일 slice 내부 참조

export function useUpdateOwnedCarMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      carId,
      payload,
    }: {
      carId: number;
      payload: OwnedCarRegistrationPayload;
    }) => updateOwnedCar(await getAccessToken(), carId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ownedCarQueries.all() });
    },
    retry: false,
  });
}

export function useDeleteOwnedCarMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (carId: number) => deleteOwnedCar(await getAccessToken(), carId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ownedCarQueries.all() });
    },
    retry: false,
  });
}
