'use client';

import { useMutation } from '@tanstack/react-query';

import {
  updateCarpoolStatus,
  type CarpoolDetailResponse,
  type CarpoolTransitionStatus,
} from '@/features/carpool-chat/api/carpool';

export function useCarpoolStatusMutation(companionId: string) {
  return useMutation<CarpoolDetailResponse, Error, CarpoolTransitionStatus>({
    mutationFn: (status) => updateCarpoolStatus(companionId, status),
  });
}
