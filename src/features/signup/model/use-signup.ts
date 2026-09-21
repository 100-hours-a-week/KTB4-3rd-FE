'use client';

import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@/entities/auth';
import { completeSignup, toSignupPayload } from '@/features/signup/api/signup';
import type { SignupFormValues } from '@/features/signup/model/signup-schema';

const MISSING_SIGNUP_TOKEN_MESSAGE =
  '회원가입 진행 시간이 만료됐어요. 카카오 로그인부터 다시 시도해주세요.';

export function useSignupMutation() {
  const signupToken = useAuthStore((state) => state.signupToken);

  return useMutation({
    mutationFn: async (values: SignupFormValues) => {
      if (!signupToken) {
        throw new Error(MISSING_SIGNUP_TOKEN_MESSAGE);
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
