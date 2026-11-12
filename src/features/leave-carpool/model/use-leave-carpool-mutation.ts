'use client';

import { useMutation } from '@tanstack/react-query';

import { leaveCarpool } from '@/features/leave-carpool/api/leave-carpool';

export function useLeaveCarpoolMutation() {
  return useMutation<void, Error, number>({
    mutationFn: leaveCarpool,
  });
}
