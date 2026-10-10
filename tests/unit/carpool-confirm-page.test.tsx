import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginRequiredProvider, SnackbarProvider } from '@/_app/providers';
import { CarpoolConfirmPage } from '@/_pages/carpool-confirm';
import { useAuthStore } from '@/entities/auth';
import { useCarpoolCreateStore, type CarpoolCreateDraft } from '@/features/carpool-registration';
import { server } from '@/shared/api/mocks/server';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

const navigation = vi.hoisted(() => ({
  pathname: '/carpools/new/confirm',
  push: vi.fn<(path: string) => void>(),
  replace: vi.fn<(path: string) => void>(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push, replace: navigation.replace }),
}));

const completeDraft: CarpoolCreateDraft = {
  origin: { name: '판교역', lat: 37.39451234, lng: 127.11123456 },
  destination: { name: '강남역', lat: 37.49791234, lng: 127.02761234 },
  departureDate: '2026-10-12',
  departureTime: { period: '오후', hour: 5, minute: 30 },
  recruitCount: 2,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider>
          <LoginRequiredProvider>{children}</LoginRequiredProvider>
        </SnackbarProvider>
      </QueryClientProvider>
    );
  };
}

function renderPage() {
  return render(<CarpoolConfirmPage />, { wrapper: createWrapper() });
}

beforeEach(() => {
  navigation.pathname = '/carpools/new/confirm';
  navigation.push.mockReset();
  navigation.replace.mockReset();
  useCarpoolCreateStore.getState().reset();
  useCarpoolCreateStore.setState({ draft: completeDraft });
  useAuthStore.getState().setAccessToken('mock-access-token');
});

afterEach(() => {
  cleanup();
  useCarpoolCreateStore.getState().reset();
  useAuthStore.getState().clearTokens();
  useSnackbarStore.getState().reset();
});

describe('CarpoolConfirmPage', () => {
  it('draft 요약만 표시하고 성공하면 한 번 등록한 뒤 초기화하고 매칭으로 이동한다', async () => {
    const requests: Request[] = [];
    server.use(
      http.post('*/carpools', async ({ request }) => {
        requests.push(request.clone());
        return HttpResponse.json(
          {
            message: '카풀 등록 성공',
            data: {
              id: 51,
              chat_room_id: 620,
              capacity: 3,
              current_count: 1,
              status: 'RECRUITING',
            },
          },
          { status: 201 },
        );
      }),
    );

    renderPage();
    expect(screen.getByRole('heading', { name: '이 정보가 맞나요?' })).toBeInTheDocument();
    expect(screen.getByText('판교역')).toBeInTheDocument();
    expect(screen.getByText('강남역')).toBeInTheDocument();
    expect(screen.getByText('2명 모집 (+운전자)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '카풀 등록하기' }));
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/matching'));
    expect(requests).toHaveLength(1);
    expect(await requests[0].json()).toMatchObject({
      origin_lat: 37.394512,
      origin_lng: 127.111235,
      departure_at: '2026-10-12T08:30:00.000Z',
      recruit_count: 2,
    });
    expect(useCarpoolCreateStore.getState().draft.origin).toBeNull();
    expect(useSnackbarStore.getState()).toMatchObject({ open: true, type: 'positive' });
  });

  it('등록 중에는 뒤로가기와 중복 제출을 막는다', async () => {
    let resolveResponse!: (response: Response) => void;
    const response = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    let requestCount = 0;
    server.use(
      http.post('*/carpools', async () => {
        requestCount += 1;
        return response;
      }),
    );

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: '카풀 등록하기' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '뒤로가기' })).toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: '카풀 등록하기' }));
    fireEvent.click(screen.getByRole('button', { name: '뒤로가기' }));
    expect(requestCount).toBe(1);
    expect(navigation.push).not.toHaveBeenCalledWith('/carpools/new/info');

    resolveResponse(
      HttpResponse.json(
        {
          message: '카풀 등록 성공',
          data: { id: 51, chat_room_id: 620, capacity: 3, current_count: 1, status: 'RECRUITING' },
        },
        { status: 201 },
      ),
    );
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/matching'));
  });

  it('비로그인 클릭은 로그인 Dialog만 열고 인증 완료 후 자동 제출하지 않는다', async () => {
    let requestCount = 0;
    server.use(
      http.post('*/carpools', () => {
        requestCount += 1;
        return HttpResponse.json({ message: 'unexpected' }, { status: 201 });
      }),
    );
    useAuthStore.getState().clearTokens();
    navigation.pathname = '/';

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: '카풀 등록하기' }));
    expect(screen.getByRole('dialog', { name: '로그인이 필요해요' })).toBeInTheDocument();
    useAuthStore.getState().setAccessToken('mock-access-token');
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '로그인이 필요해요' })).not.toBeInTheDocument(),
    );
    expect(requestCount).toBe(0);
  });

  it('등록 오류는 페이지와 draft를 유지하고 차량 등록 다이얼로그를 띄우지 않는다', async () => {
    server.use(
      http.post('*/carpools', () =>
        HttpResponse.json(
          {
            message: '차량 정보를 먼저 등록해주세요',
            error: { code: 'CAR_REGISTRATION_REQUIRED', field: null },
          },
          { status: 409 },
        ),
      ),
    );

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: '카풀 등록하기' }));
    await waitFor(() => expect(useSnackbarStore.getState().open).toBe(true));

    expect(useSnackbarStore.getState().description).toBe('차량 정보를 먼저 등록해주세요.');
    expect(navigation.push).not.toHaveBeenCalled();
    expect(useCarpoolCreateStore.getState().draft).toEqual(completeDraft);
    expect(screen.queryByRole('dialog', { name: /차량/ })).not.toBeInTheDocument();
  });

  it('위치나 추가 정보가 빠진 직접 진입을 앞 단계로 보낸다', async () => {
    useCarpoolCreateStore.getState().reset();
    const { rerender } = renderPage();
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/carpools/new'));

    navigation.replace.mockReset();
    useCarpoolCreateStore.setState({
      draft: { ...completeDraft, departureDate: null, departureTime: null, recruitCount: null },
    });
    rerender(<CarpoolConfirmPage />);
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/carpools/new/info'));

    navigation.replace.mockReset();
    useCarpoolCreateStore.setState({
      draft: {
        ...completeDraft,
        origin: { name: ' ', lat: 37.39451234, lng: 127.11123456 },
      },
    });
    rerender(<CarpoolConfirmPage />);
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/carpools/new'));
  });
});
