import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { useSignupMutation } from '@/features/signup';
import { GenderCode } from '@/features/signup/model/gender';
import type { SignupFormValues } from '@/features/signup/model/signup-schema';
import { server } from '@/shared/api/mocks/server';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

const signupValues: SignupFormValues = {
  profile_image_key: new File(['profile'], 'profile.png', { type: 'image/png' }),
  nickname: '제리',
  gender: GenderCode.MALE,
  bank_name: null,
  account_no: '',
  agreements: {
    service: true,
    location: true,
    gender: true,
    account_third_party: false,
    marketing: false,
  },
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
  useSnackbarStore.getState().reset();
});

describe('useSignupMutation', () => {
  it('signup token이 없어도 회원가입 API 요청을 보낸다', async () => {
    const { result } = renderHook(() => useSignupMutation(), { wrapper: createWrapper() });
    result.current.mutate(signupValues);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    });
  });

  it('가입에 성공하면 토큰을 재발급받아 access token을 저장하고 signup token을 폐기한다', async () => {
    useAuthStore.getState().setSignupToken('mock-signup-token');
    const refreshRequest = vi.fn<() => void>();
    server.use(
      http.post('*/users', ({ request }) => {
        expect(request.headers.get('authorization')).toBeNull();

        return HttpResponse.json(
          {
            message: '가입이 완료되었어요',
            data: {
              user_id: 15,
              access_token: 'signup-response-token',
              created_at: '2026-09-06T09:00:00',
            },
          },
          { status: 201 },
        );
      }),
      http.post('*/auth/tokens', ({ request }) => {
        refreshRequest();
        expect(request.headers.get('authorization')).toBeNull();

        return HttpResponse.json({
          message: '토큰이 재발급되었어요',
          data: { access_token: 'refreshed-access-token' },
        });
      }),
    );

    const { result } = renderHook(() => useSignupMutation(), { wrapper: createWrapper() });
    result.current.mutate(signupValues);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'refreshed-access-token',
      signupToken: null,
    });
    expect(refreshRequest).toHaveBeenCalledOnce();
    expect(useSnackbarStore.getState()).toMatchObject({
      description: '가입이 완료되었어요',
      open: true,
      type: 'positive',
    });
  });

  it('가입에 실패하면 API 오류 상태를 노출하고 토큰을 유지한다', async () => {
    useAuthStore.getState().setSignupToken('mock-signup-token');
    server.use(
      http.post('*/users', ({ request }) => {
        expect(request.headers.get('authorization')).toBeNull();

        return HttpResponse.json(
          {
            message: '이미 사용 중인 닉네임이에요',
            error: { code: 'NICKNAME_DUPLICATE', field: 'nickname' },
          },
          { status: 409 },
        );
      }),
    );

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
