import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { useSignupMutation } from '@/features/signup';
import type { SignupFormValues } from '@/features/signup/model/signup-schema';

const signupValues: SignupFormValues = {
  profileImage: new File(['profile'], 'profile.png', { type: 'image/png' }),
  nickname: '제리',
  bank: null,
  accountNumber: '',
  serviceTerms: true,
  locationTerms: true,
  genderTerms: true,
  accountInfoTerms: false,
  marketingTerms: false,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

afterEach(() => {
  useAuthStore.getState().clearTokens();
});

describe('useSignupMutation', () => {
  it('가입에 성공하면 access token을 저장하고 signup token을 폐기한다', async () => {
    useAuthStore.getState().setSignupToken('mock-signup-token');

    const { result } = renderHook(() => useSignupMutation(), { wrapper: createWrapper() });
    result.current.mutate(signupValues);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'mock-access-token',
      signupToken: null,
    });
  });

  it('가입에 실패하면 API 오류 상태를 노출하고 토큰을 유지한다', async () => {
    useAuthStore.getState().setSignupToken('mock-signup-token');

    const { result } = renderHook(() => useSignupMutation(), { wrapper: createWrapper() });
    result.current.mutate({ ...signupValues, nickname: '중복닉네임' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toMatchObject({
      status: 409,
      code: 'NICKNAME_DUPLICATE',
      field: 'nickname',
    });
    expect(useAuthStore.getState().signupToken).toBe('mock-signup-token');
  });
});
