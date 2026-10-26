import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { OwnedCarManagementPage } from '@/_pages/owned-car-management';
import { useAuthStore } from '@/entities/auth';
import { server } from '@/shared/api/mocks/server';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

const navigation = vi.hoisted(() => ({
  push: vi.fn<(path: string) => void>(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
}));

const initialCar = { id: 12, model: '아반떼', number: '12가3456' };

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <OwnedCarManagementPage />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  document.querySelectorAll('[data-base-ui-portal]').forEach((portal) => portal.remove());
  navigation.push.mockReset();
  useAuthStore.getState().clearTokens();
  useSnackbarStore.getState().reset();
});

describe('OwnedCarManagementPage', () => {
  it('프로필 메뉴에서 진입하면 등록된 차량을 조회해 차종과 번호를 표시한다', async () => {
    useAuthStore.getState().setAccessToken('mock-access-token');
    server.use(
      http.get('*/users/me/cars', () =>
        HttpResponse.json({ message: '조회에 성공했습니다', data: { cars: [initialCar] } }),
      ),
    );

    renderPage();

    expect(await screen.findByText('아반떼')).toBeInTheDocument();
    expect(screen.getByText('12가3456')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
  });

  it('차량 목록을 불러오는 동안 로딩 상태를 표시한다', async () => {
    useAuthStore.getState().setAccessToken('mock-access-token');
    server.use(
      http.get('*/users/me/cars', async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json({ message: '조회에 성공했습니다', data: { cars: [initialCar] } });
      }),
    );

    renderPage();

    expect(screen.getByRole('region', { name: '등록된 차량 정보를 불러오는 중' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('등록된 차량이 없으면 빈 상태를 표시한다', async () => {
    useAuthStore.getState().setAccessToken('mock-access-token');
    server.use(
      http.get('*/users/me/cars', () =>
        HttpResponse.json({ message: '등록된 차량이 없습니다', data: { cars: [] } }),
      ),
    );

    renderPage();

    expect(await screen.findByText('등록된 차량이 없어요')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument();
  });

  it('차량 목록 조회에 실패하면 오류 상태와 다시 불러오기 버튼을 표시한다', async () => {
    useAuthStore.getState().setAccessToken('mock-access-token');
    server.use(
      http.get('*/users/me/cars', () =>
        HttpResponse.json(
          { message: '차량 목록을 조회하지 못했습니다', error: { code: 'INTERNAL_SERVER_ERROR' } },
          { status: 500 },
        ),
      ),
    );

    renderPage();

    expect(await screen.findByText('차량 정보를 불러올 수 없어요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 불러오기' })).toBeInTheDocument();
  });

  it('차량 정보를 수정하면 PUT 요청을 보내고 갱신된 정보를 표시한다', async () => {
    const user = userEvent.setup();
    let currentCar = initialCar;
    let updateRequest: Request | undefined;
    useAuthStore.getState().setAccessToken('mock-access-token');
    server.use(
      http.get('*/users/me/cars', () =>
        HttpResponse.json({ message: '조회에 성공했습니다', data: { cars: [currentCar] } }),
      ),
      http.put('*/users/me/cars/12', async ({ request }) => {
        updateRequest = request.clone();
        const payload = (await request.json()) as { model: string; number: string };
        currentCar = { ...currentCar, ...payload };
        return HttpResponse.json({
          message: '차량 정보가 수정되었습니다',
          data: { updatedAt: '2026-10-26T03:00:00' },
        });
      }),
    );

    renderPage();
    await user.click(await screen.findByRole('button', { name: '수정' }));
    await user.clear(screen.getByRole('textbox', { name: '차량 번호' }));
    await user.type(screen.getByRole('textbox', { name: '차량 번호' }), '34나5678');
    await user.clear(screen.getByRole('textbox', { name: '차종' }));
    await user.type(screen.getByRole('textbox', { name: '차종' }), '쏘나타');
    await user.click(screen.getByRole('button', { name: '저장하기' }));

    await waitFor(() => expect(updateRequest).toBeDefined());
    expect(updateRequest?.method).toBe('PUT');
    expect(await updateRequest?.json()).toEqual({ model: '쏘나타', number: '34나5678' });
    expect(await screen.findByText('쏘나타')).toBeInTheDocument();
    expect(screen.getByText('34나5678')).toBeInTheDocument();
  });

  it('수정에 실패하면 입력값과 오류를 유지한다', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAccessToken('mock-access-token');
    server.use(
      http.get('*/users/me/cars', () =>
        HttpResponse.json({ message: '조회에 성공했습니다', data: { cars: [initialCar] } }),
      ),
      http.put('*/users/me/cars/12', () =>
        HttpResponse.json(
          { message: '차량 정보를 수정하지 못했습니다', error: { code: 'CAR_NOT_FOUND' } },
          { status: 404 },
        ),
      ),
    );

    renderPage();
    await user.click(await screen.findByRole('button', { name: '수정' }));
    await user.click(screen.getByRole('button', { name: '저장하기' }));

    expect(await screen.findByText('차량 정보를 수정하지 못했습니다')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '차량 번호' })).toHaveValue('12가3456');
    expect(screen.getByRole('textbox', { name: '차종' })).toHaveValue('아반떼');
  });

  it('삭제 확인 후 DELETE 요청을 보내고 빈 상태로 갱신한다', async () => {
    const user = userEvent.setup();
    let currentCar: typeof initialCar | null = initialCar;
    let deleteRequest: Request | undefined;
    useAuthStore.getState().setAccessToken('mock-access-token');
    server.use(
      http.get('*/users/me/cars', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: { cars: currentCar ? [currentCar] : [] },
        }),
      ),
      http.delete('*/users/me/cars/12', ({ request }) => {
        deleteRequest = request;
        currentCar = null;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderPage();
    await user.click(await screen.findByRole('button', { name: '삭제' }));
    expect(screen.getByRole('dialog', { name: '차량 정보를 삭제할까요?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '삭제하기' }));

    await waitFor(() => expect(deleteRequest).toBeDefined());
    expect(deleteRequest?.method).toBe('DELETE');
    expect(await screen.findByText('등록된 차량이 없어요')).toBeInTheDocument();
  });

  it('삭제에 실패하면 확인 Dialog를 유지하고 오류를 표시한다', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAccessToken('mock-access-token');
    server.use(
      http.get('*/users/me/cars', () =>
        HttpResponse.json({ message: '조회에 성공했습니다', data: { cars: [initialCar] } }),
      ),
      http.delete('*/users/me/cars/12', () =>
        HttpResponse.json(
          { message: '차량 정보를 삭제하지 못했습니다', error: { code: 'CAR_NOT_FOUND' } },
          { status: 404 },
        ),
      ),
    );

    renderPage();
    await user.click(await screen.findByRole('button', { name: '삭제' }));
    await user.click(screen.getByRole('button', { name: '삭제하기' }));

    expect(await screen.findByText('차량 정보를 삭제하지 못했습니다')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '차량 정보를 삭제할까요?' })).toBeInTheDocument();
  });

  it('비로그인 사용자는 로그인 안내를 표시한다', () => {
    renderPage();

    expect(screen.getByText('로그인이 필요해요')).toBeInTheDocument();
  });
});
