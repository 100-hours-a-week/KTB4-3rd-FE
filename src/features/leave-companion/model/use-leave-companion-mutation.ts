'use client';

import { useMutation } from '@tanstack/react-query';

import { leaveCompanion } from '@/features/leave-companion/api/leave-companion';

export function useLeaveCompanionMutation() {
  return useMutation<void, Error, number>({
    mutationFn: leaveCompanion,
  });
}
