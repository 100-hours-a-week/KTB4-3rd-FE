'use client';

import { useMutation } from '@tanstack/react-query';

import { refreshAccessToken, useAuthStore } from '@/entities/auth';
import { completeSignup, toSignupPayload } from '@/features/signup/api/signup';
import type { SignupFormValues } from '@/features/signup/model/signup-schema';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

export function useSignupMutation() {
  return useMutation({
    mutationFn: async (values: SignupFormValues) => {
      const signupResponse = await completeSignup(toSignupPayload(values));
      const authResponse = await refreshAccessToken();

      return {
        ...authResponse,
        message: signupResponse.message,
      };
    },
    onSuccess: ({ data }) => {
      const authStore = useAuthStore.getState();
      authStore.setAccessToken(data.access_token);
      authStore.clearSignupToken();
      useSnackbarStore.getState().showSnackbar('가입이 완료되었어요', 'positive');
    },
  });
}
