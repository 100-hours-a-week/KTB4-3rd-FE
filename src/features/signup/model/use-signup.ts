'use client';

import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@/entities/auth';
import {
  completeSignup,
  toSignupPayload,
  type SignupFormValues,
} from '@/features/signup/api/signup';

export function useSignupMutation() {
  const signupToken = useAuthStore((state) => state.signupToken);

  return useMutation({
    mutationFn: async (values: SignupFormValues) => {
      if (!signupToken) {
        throw new Error('회원가입 토큰이 없습니다. 카카오 로그인을 다시 진행해주세요.');
      }

      return completeSignup(signupToken, toSignupPayload(values));
    },
    onSuccess: ({ data }) => {
      const authStore = useAuthStore.getState();
      authStore.setAccessToken(data.access_token);
      authStore.clearSignupToken();
    },
  });
}
