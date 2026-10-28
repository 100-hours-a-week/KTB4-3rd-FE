import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { SnackbarProvider } from '@/_app/providers';
import { TaxiPotMatchingPage } from '@/_pages/taxi-pot-matching';
import { useAuthStore } from '@/entities/auth';
import { useCurrentTaxiPotQuery } from '@/features/taxi-pot-matching';
import { startTaxiPotMatching } from '@/features/matching-registration';
import { server } from '@/shared/api/mocks/server';
import { MOCK_ACCESS_TOKEN } from '@/shared/api/mocks/mock-utils';
import { emitMockTaxiPotMatched } from '@/shared/api/mocks/chat-room-websocket.handlers';
import { resetTaxiPotMockState } from '@/shared/api/mocks/taxi-pots.handlers';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';
import { HttpResponse, http } from 'msw';

const navigation = vi.hoisted(() => ({ replace: vi.fn<(path: string) => void>() }));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
}));

const payload = {
  origin_name: '판교역',
  origin_lat: 37.3945,
  origin_lng: 127.1112,
  dest_name: '강남역',
  dest_lat: 37.4979,
  dest_lng: 127.0276,
  departure_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider>{children}</SnackbarProvider>
      </QueryClientProvider>
    );
  };
}

async function createMatchingRequest() {
  useAuthStore.getState().setAccessToken(MOCK_ACCESS_TOKEN);
  await startTaxiPotMatching(MOCK_ACCESS_TOKEN, payload);
}

beforeEach(() => {
  resetTaxiPotMockState();
  useAuthStore.getState().clearTokens();
  useSnackbarStore.getState().reset();
  navigation.replace.mockReset();
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  useAuthStore.getState().clearTokens();
  useSnackbarStore.getState().reset();
});

describe('TaxiPotMatchingPage', () => {
  it('확인 버튼을 누르면 매칭 홈으로 이동한다', async () => {
    const user = userEvent.setup();
    render(<TaxiPotMatchingPage />, { wrapper: createQueryWrapper() });

    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(navigation.replace).toHaveBeenCalledExactlyOnceWith('/matching');
  });

  it('매칭 취소에 성공하면 홈으로 이동하고 성공 스낵바를 표시한다', async () => {
    await createMatchingRequest();
    const user = userEvent.setup();
    render(<TaxiPotMatchingPage />, { wrapper: createQueryWrapper() });

    await user.click(screen.getByRole('button', { name: '매칭 취소' }));

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/matching'));
    expect(useSnackbarStore.getState()).toMatchObject({
      description: '매칭을 취소했어요',
      type: 'positive',
      open: true,
    });
  });

  it('매칭 완료 웹소켓 이벤트를 받으면 채팅방으로 이동한다', async () => {
    await createMatchingRequest();
    render(<TaxiPotMatchingPage />, { wrapper: createQueryWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 20));
    emitMockTaxiPotMatched({ type: 'MATCHED', taxi_pot_id: 7, chat_room_id: 9 });

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/chatroom/9'));
  });

  it('매칭 취소에 실패하면 모달을 유지하고 실패 스낵바를 표시한다', async () => {
    await createMatchingRequest();
    server.use(
      http.delete('*/taxi-pots/match-requests/me', () =>
        HttpResponse.json(
          {
            message: '취소하지 못했습니다',
            error: { code: 'INTERNAL_SERVER_ERROR', field: null },
          },
          { status: 500 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<TaxiPotMatchingPage />, { wrapper: createQueryWrapper() });

    await user.click(screen.getByRole('button', { name: '매칭 취소' }));

    await waitFor(() =>
      expect(useSnackbarStore.getState()).toMatchObject({
        description: '매칭 취소를 실패했어요',
        type: 'critical',
        open: true,
      }),
    );
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: /택시팟을 매칭 중이에요/ })).toBeVisible();
  });
});

describe('useCurrentTaxiPotQuery', () => {
  it('비활성화된 query도 진입 시 refetch할 수 있다', async () => {
    await createMatchingRequest();

    function QueryFixture() {
      const query = useCurrentTaxiPotQuery({ enabled: false });

      return (
        <button type="button" onClick={() => void query.refetch()}>
          조회
        </button>
      );
    }

    const user = userEvent.setup();
    render(<QueryFixture />, { wrapper: createQueryWrapper() });
    await user.click(screen.getByRole('button', { name: '조회' }));

    await waitFor(() => expect(screen.getByRole('button', { name: '조회' })).toBeInTheDocument());
  });
});
