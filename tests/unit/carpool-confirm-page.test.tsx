import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginRequiredProvider, SnackbarProvider } from '@/_app/providers';
import { CarpoolRegistrationDraftAuthSync } from '@/_app/providers/carpool-registration-draft-auth-sync';
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

const FIXED_NOW = new Date('2026-10-12T08:00:00.000Z');

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

function createAuthSyncWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider>
          <LoginRequiredProvider>
            <CarpoolRegistrationDraftAuthSync />
            {children}
          </LoginRequiredProvider>
        </SnackbarProvider>
      </QueryClientProvider>
    );
  };
}

function renderPage() {
  return render(<CarpoolConfirmPage />, { wrapper: createWrapper() });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(FIXED_NOW);
  navigation.pathname = '/carpools/new/confirm';
  navigation.push.mockReset();
  navigation.replace.mockReset();
  useCarpoolCreateStore.getState().reset();
  useCarpoolCreateStore.setState({ draft: completeDraft });
  useAuthStore.getState().setAccessToken('mock-access-token');
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
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
    expect(screen.getByText('2명 모집')).toBeInTheDocument();

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

  it('긴 출발지와 도착지 이름은 줄바꿈되고 요약 행 높이가 늘어난다', () => {
    const longOrigin = '서울특별시 강남구 테헤란로 123 판교역 방면 출발 지점';
    const longDestination = '경기도 성남시 분당구 판교역로 235 판교테크노밸리 도착 지점';
    useCarpoolCreateStore.setState({
      draft: {
        ...completeDraft,
        origin: {
          name: longOrigin,
          lat: completeDraft.origin?.lat ?? 0,
          lng: completeDraft.origin?.lng ?? 0,
        },
        destination: {
          name: longDestination,
          lat: completeDraft.destination?.lat ?? 0,
          lng: completeDraft.destination?.lng ?? 0,
        },
      },
    });

    renderPage();

    for (const [label, value] of [
      ['출발지', longOrigin],
      ['도착지', longDestination],
    ]) {
      const valueElement = screen.getByText(value);
      const row = screen.getByText(label).parentElement;

      expect(valueElement).toHaveClass('min-h-12', 'whitespace-normal', 'break-words');
      expect(valueElement).not.toHaveClass('truncate');
      expect(row).toHaveClass('min-h-12');
      expect(row).not.toHaveClass('overflow-hidden');
    }
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

  it('차량 정보를 저장하고 Dialog를 닫은 뒤에는 사용자가 카풀 등록을 다시 눌러야 한다', async () => {
    let carpoolRequestCount = 0;
    const carRequests: Request[] = [];
    server.use(
      http.post('*/carpools', () => {
        carpoolRequestCount += 1;
        if (carRequests.length === 0) {
          return HttpResponse.json(
            {
              message: '차량 정보를 먼저 등록해주세요',
              error: { code: 'CAR_REGISTRATION_REQUIRED', field: null },
            },
            { status: 409 },
          );
        }

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
      http.post('*/users/me/cars', async ({ request }) => {
        carRequests.push(request.clone());
        return HttpResponse.json(
          { message: '차량 등록 성공', data: { id: 12, createdAt: '2026-10-11T05:00:00' } },
          { status: 201 },
        );
      }),
    );

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: '카풀 등록하기' }));
    const dialog = await screen.findByRole('dialog', { name: '카풀 등록이 처음이시군요!' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '차량 번호' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '차종' })).toBeInTheDocument();
    expect(screen.queryByText('도움말 텍스트 입력')).not.toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(useCarpoolCreateStore.getState().draft).toEqual(completeDraft);
    expect(useSnackbarStore.getState().open).toBe(false);
    expect(carpoolRequestCount).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(useCarpoolCreateStore.getState().draft).toEqual(completeDraft);
    expect(carpoolRequestCount).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: '카풀 등록하기' }));
    const reopenedDialog = await screen.findByRole('dialog', { name: '카풀 등록이 처음이시군요!' });
    fireEvent.change(screen.getByRole('textbox', { name: '차량 번호' }), {
      target: { value: '12가3456' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '차종' }), {
      target: { value: '승용차' },
    });
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => expect(reopenedDialog).not.toBeInTheDocument());
    expect(carRequests).toHaveLength(1);
    expect(carRequests[0].headers.get('authorization')).toBe('Bearer mock-access-token');
    expect(await carRequests[0].json()).toEqual({ number: '12가3456', model: '승용차' });
    expect(carpoolRequestCount).toBe(2);
    expect(useCarpoolCreateStore.getState().draft).toEqual(completeDraft);
    expect(
      screen.getByText('차량 정보가 저장되었어요. 카풀 등록을 다시 눌러주세요.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '카풀 등록하기' }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/matching'));
    expect(carpoolRequestCount).toBe(3);
    expect(useCarpoolCreateStore.getState().draft.origin).toBeNull();
  });

  it('차량 번호와 차종 누락 또는 글자 수 초과는 차량 API를 호출하지 않는다', async () => {
    const registrationRequest = vi.fn<() => void>();
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
      http.post('*/users/me/cars', () => {
        registrationRequest();
        return HttpResponse.json({ message: 'unexpected' }, { status: 201 });
      }),
    );

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: '카풀 등록하기' }));
    const dialog = await screen.findByRole('dialog', { name: '카풀 등록이 처음이시군요!' });
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByText('차량 번호와 차종을 입력해주세요.')).toBeInTheDocument();
    expect(registrationRequest).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('textbox', { name: '차량 번호' }), {
      target: { value: '12가345678901234567890' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '차종' }), {
      target: { value: '승용차' },
    });
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(
      screen.getByText('차량 번호는 20자, 차종은 50자 이내로 입력해주세요.'),
    ).toBeInTheDocument();
    expect(registrationRequest).not.toHaveBeenCalled();
    expect(dialog).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: '차량 번호' }), {
      target: { value: '12가3456' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '차종' }), {
      target: { value: '차'.repeat(51) },
    });
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(
      screen.getByText('차량 번호는 20자, 차종은 50자 이내로 입력해주세요.'),
    ).toBeInTheDocument();
    expect(registrationRequest).not.toHaveBeenCalled();
  });

  it('차량 저장 실패는 입력을 유지하고 자동 재전송하지 않는다', async () => {
    let carpoolRequestCount = 0;
    let vehicleRequestCount = 0;
    server.use(
      http.post('*/carpools', () => {
        carpoolRequestCount += 1;
        return HttpResponse.json(
          {
            message: '차량 정보를 먼저 등록해주세요',
            error: { code: 'CAR_REGISTRATION_REQUIRED', field: null },
          },
          { status: 409 },
        );
      }),
      http.post('*/users/me/cars', () => {
        vehicleRequestCount += 1;
        if (vehicleRequestCount === 1) {
          return HttpResponse.json(
            { message: '일시적으로 요청을 처리하지 못했습니다' },
            { status: 500 },
          );
        }

        return HttpResponse.json(
          { message: '차량 등록 성공', data: { id: 12, createdAt: '2026-10-11T05:00:00' } },
          { status: 201 },
        );
      }),
    );

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: '카풀 등록하기' }));
    const dialog = await screen.findByRole('dialog', { name: '카풀 등록이 처음이시군요!' });
    fireEvent.change(screen.getByRole('textbox', { name: '차량 번호' }), {
      target: { value: '12가3456' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '차종' }), {
      target: { value: '승용차' },
    });
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(
      await screen.findByText(
        '차량 정보를 저장하지 못했어요. 입력한 내용을 확인하고 다시 시도해주세요.',
      ),
    ).toBeInTheDocument();
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '차량 번호' })).toHaveValue('12가3456');
    expect(screen.getByRole('textbox', { name: '차종' })).toHaveValue('승용차');
    expect(vehicleRequestCount).toBe(1);
    expect(carpoolRequestCount).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(vehicleRequestCount).toBe(2);
    expect(carpoolRequestCount).toBe(1);
    expect(useCarpoolCreateStore.getState().draft).toEqual(completeDraft);
  });

  it('이미 등록된 차량 오류는 카풀을 자동 재등록하지 않고 사용자의 재요청을 기다린다', async () => {
    let carpoolRequestCount = 0;
    server.use(
      http.post('*/carpools', () => {
        carpoolRequestCount += 1;
        return HttpResponse.json(
          {
            message: '차량 정보를 먼저 등록해주세요',
            error: { code: 'CAR_REGISTRATION_REQUIRED', field: null },
          },
          { status: 409 },
        );
      }),
      http.post('*/users/me/cars', () =>
        HttpResponse.json(
          {
            message: '이미 등록한 차량이 있습니다',
            error: { code: 'CAR_ALREADY_REGISTERED', field: null },
          },
          { status: 409 },
        ),
      ),
    );

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: '카풀 등록하기' }));
    const dialog = await screen.findByRole('dialog', { name: '카풀 등록이 처음이시군요!' });
    fireEvent.change(screen.getByRole('textbox', { name: '차량 번호' }), {
      target: { value: '12가3456' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '차종' }), {
      target: { value: '승용차' },
    });
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(
      screen.getByText('이미 등록된 차량이 있어요. 카풀 등록을 다시 눌러주세요.'),
    ).toBeInTheDocument();
    expect(carpoolRequestCount).toBe(1);
    expect(useCarpoolCreateStore.getState().draft).toEqual(completeDraft);
  });

  it('최종 UNAUTHORIZED 응답은 같은 계정의 초안을 유지하고 공통 로그인 Dialog를 연다', async () => {
    let requestCount = 0;
    let userLookupCount = 0;
    server.use(
      http.get('*/users/me', () => {
        userLookupCount += 1;
        return HttpResponse.json({
          message: '내 정보 조회 성공',
          data: { id: 1, nickname: '제리', profile_image_url: null },
        });
      }),
      http.post('*/auth/tokens', () =>
        HttpResponse.json({
          message: '토큰 재발급 성공',
          data: { access_token: 'refreshed-session-a' },
        }),
      ),
      http.post('*/carpools', () => {
        requestCount += 1;
        return HttpResponse.json(
          {
            message: '로그인이 필요합니다',
            error: { code: 'UNAUTHORIZED', field: null },
          },
          { status: 401 },
        );
      }),
    );

    render(<CarpoolConfirmPage />, { wrapper: createAuthSyncWrapper() });
    await waitFor(() => expect(userLookupCount).toBe(1));
    fireEvent.click(screen.getByRole('button', { name: '카풀 등록하기' }));

    expect(await screen.findByRole('dialog', { name: '로그인이 필요해요' })).toBeInTheDocument();
    expect(screen.getByText('이 정보가 맞나요?')).toBeInTheDocument();
    expect(useCarpoolCreateStore.getState().draft).toEqual(completeDraft);
    expect(useSnackbarStore.getState().open).toBe(false);
    expect(requestCount).toBe(2);
  });

  it('계정 A의 등록 응답이 늦게 와도 계정 B의 새 초안과 화면 이동을 건드리지 않는다', async () => {
    let resolveResponse!: (response: Response) => void;
    const response = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    let requestCount = 0;
    let userLookupCount = 0;
    server.use(
      http.get('*/users/me', ({ request }) => {
        userLookupCount += 1;
        const isAccountB = request.headers.get('authorization') === 'Bearer account-b-token';
        return HttpResponse.json({
          message: '내 정보 조회 성공',
          data: { id: isAccountB ? 2 : 1, nickname: '사용자', profile_image_url: null },
        });
      }),
      http.post('*/carpools', async () => {
        requestCount += 1;
        return response;
      }),
    );

    render(<CarpoolConfirmPage />, { wrapper: createAuthSyncWrapper() });
    await waitFor(() => expect(userLookupCount).toBe(1));
    fireEvent.click(screen.getByRole('button', { name: '카풀 등록하기' }));
    await waitFor(() => expect(requestCount).toBe(1));

    act(() => useAuthStore.getState().setAccessToken('account-b-token'));
    await waitFor(() => {
      expect(userLookupCount).toBe(2);
      expect(useCarpoolCreateStore.getState().draft.origin).toBeNull();
    });

    const accountBDraft: CarpoolCreateDraft = {
      ...completeDraft,
      origin: { name: '성수역', lat: 37.5445, lng: 127.056 },
    };
    act(() => useCarpoolCreateStore.setState({ draft: accountBDraft }));

    resolveResponse(
      HttpResponse.json(
        {
          message: '카풀 등록 성공',
          data: {
            id: 52,
            chat_room_id: 621,
            capacity: 3,
            current_count: 1,
            status: 'RECRUITING',
          },
        },
        { status: 201 },
      ),
    );

    await waitFor(() => expect(screen.getByText('카풀 등록하기')).toBeEnabled());
    expect(useCarpoolCreateStore.getState().draft).toBe(accountBDraft);
    expect(navigation.push).not.toHaveBeenCalledWith('/matching');
    expect(useSnackbarStore.getState().type).not.toBe('positive');
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
