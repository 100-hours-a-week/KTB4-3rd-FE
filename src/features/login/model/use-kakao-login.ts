'use client';

import { useMutation } from '@tanstack/react-query';

import { loginWithKakao, useAuthStore } from '@/entities/auth';

export function useKakaoLoginMutation() {
  return useMutation({
    mutationFn: loginWithKakao,
    onSuccess: ({ data }) => {
      const authStore = useAuthStore.getState();

      if (data.is_new_user && data.signup_token) {
        authStore.setSignupToken(data.signup_token);
        return;
      }

      if (!data.is_new_user && data.access_token) {
        authStore.setAccessToken(data.access_token);
      }
    },
  });
}
