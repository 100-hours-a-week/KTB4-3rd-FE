import { http, HttpResponse } from 'msw';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AuthBootstrapProvider } from '@/_app/providers';
import { useAuthStore } from '@/entities/auth';
import { server } from '@/shared/api/mocks/server';

function AuthStateProbe() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return <output>{accessToken ?? 'anonymous'}</output>;
}

afterEach(() => {
  cleanup();
  useAuthStore.getState().clearTokens();
  server.resetHandlers();
});

describe('AuthBootstrapProvider', () => {
  it('refresh 쿠키로 access token을 복원한다', async () => {
    server.use(
      http.post('*/auth/tokens', () =>
        HttpResponse.json({
          message: '토큰이 재발급되었습니다',
          data: { access_token: 'mock-access-token' },
        }),
      ),
    );

    render(
      <AuthBootstrapProvider>
        <AuthStateProbe />
      </AuthBootstrapProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('mock-access-token')).toBeInTheDocument();
    });
    expect(useAuthStore.getState().accessToken).toBe('mock-access-token');
  });

  it('토큰 재발급에 실패하면 비로그인 상태로 초기화하고 앱을 렌더링한다', async () => {
    server.use(
      http.post('*/auth/tokens', () =>
        HttpResponse.json(
          {
            message: '인증이 필요합니다',
            error: { code: 'UNAUTHORIZED', field: null },
          },
          { status: 401 },
        ),
      ),
    );

    render(
      <AuthBootstrapProvider>
        <AuthStateProbe />
      </AuthBootstrapProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('anonymous')).toBeInTheDocument();
    });
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
