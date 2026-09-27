'use client';

import { useMutation } from '@tanstack/react-query';

import { checkNicknameAvailability } from '@/features/signup/api/nickname';

export function useNicknameAvailabilityMutation() {
  return useMutation({
    mutationFn: (nickname: string) => checkNicknameAvailability(nickname),
  });
}
