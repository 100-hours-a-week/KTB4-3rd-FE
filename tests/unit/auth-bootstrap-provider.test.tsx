import { http, HttpResponse } from 'msw';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AuthBootstrapProvider } from '@/_app/providers';
import { useAuthStore } from '@/entities/auth';
import { useCarpoolCreateStore } from '@/features/carpool-registration';
import { server } from '@/shared/api/mocks/server';

function AuthStateProbe() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return <output>{accessToken ?? 'anonymous'}</output>;
}

afterEach(() => {
  cleanup();
  useAuthStore.getState().clearTokens();
  useCarpoolCreateStore.getState().reset();
  server.resetHandlers();
});

describe('AuthBootstrapProvider', () => {
  it('인증 복원 중에는 초안을 유지하고 비로그인이 확정된 뒤 초기화한다', async () => {
    let finishRefresh!: () => void;
    const refreshGate = new Promise<void>((resolve) => {
      finishRefresh = resolve;
    });
    useCarpoolCreateStore.getState().setOrigin({ name: '서울역', lat: 37.55, lng: 126.97 });
    server.use(
      http.post('*/auth/tokens', async () => {
        await refreshGate;
        return HttpResponse.json(
          {
            message: '인증이 필요합니다',
            error: { code: 'UNAUTHORIZED', field: null },
          },
          { status: 401 },
        );
      }),
    );

    render(
      <AuthBootstrapProvider>
        <AuthStateProbe />
      </AuthBootstrapProvider>,
    );

    expect(useCarpoolCreateStore.getState().draft.origin?.name).toBe('서울역');
    expect(screen.queryByText('anonymous')).not.toBeInTheDocument();

    await act(async () => finishRefresh());
    await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument());
    await waitFor(() => expect(useCarpoolCreateStore.getState().draft.origin).toBeNull());
  });

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

  it('토큰 재발급에 실패하면 저장된 access token도 초기화한다', async () => {
    useAuthStore.getState().setAccessToken('persisted-access-token');
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
