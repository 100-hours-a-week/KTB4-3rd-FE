import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CarpoolInfoPage } from '@/_pages/carpool-info';
import { SnackbarProvider } from '@/_app/providers';
import { useCarpoolCreateStore } from '@/features/carpool-registration';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

const router = vi.hoisted(() => ({
  push: vi.fn<(path: string) => void>(),
  replace: vi.fn<(path: string) => void>(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}));

const validLocations = {
  origin: { name: '서울역', lat: 37.5547, lng: 126.9707 },
  destination: { name: '강남역', lat: 37.4979, lng: 127.0276 },
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-11T09:00:00.000Z'));
  useCarpoolCreateStore.getState().reset();
  useSnackbarStore.getState().reset();
  router.push.mockReset();
  router.replace.mockReset();
});

afterEach(() => {
  cleanup();
  useCarpoolCreateStore.getState().reset();
  useSnackbarStore.getState().reset();
  vi.useRealTimers();
});

function setValidLocations() {
  useCarpoolCreateStore.getState().setOrigin(validLocations.origin);
  useCarpoolCreateStore.getState().setDestination(validLocations.destination);
}

function setCompleteDraft(date: string, hour: number, period: '오전' | '오후') {
  const store = useCarpoolCreateStore.getState();
  store.setOrigin(validLocations.origin);
  store.setDestination(validLocations.destination);
  store.setDepartureDate(date);
  store.setDepartureTime({
    period,
    hour: hour as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
    minute: 30,
  });
  store.setRecruitCount(2);
}

function renderPage() {
  return render(
    <SnackbarProvider>
      <CarpoolInfoPage />
    </SnackbarProvider>,
  );
}

describe('CarpoolInfoPage', () => {
  it('입력한 초안 값을 복원하고 필수 입력이 없으면 다음 버튼을 비활성화한다', () => {
    setValidLocations();
    useCarpoolCreateStore.getState().setDepartureDate('2026-10-12');

    renderPage();

    expect(screen.getByRole('button', { name: '출발 날짜' })).toHaveTextContent('2026/10/12');
    expect(screen.getByRole('button', { name: '출발 시간' })).toHaveTextContent(
      '시간을 선택해 주세요',
    );
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('위치 정보가 없으면 카풀 이동 경로 입력 화면으로 돌아간다', async () => {
    renderPage();

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/carpools/new'));
  });

  it('현재 시각 이후이고 한 달 안의 입력을 확인 화면으로 보낸다', async () => {
    setCompleteDraft('2026-10-12', 7, '오후');
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(router.push).toHaveBeenCalledWith('/carpools/new/confirm');
    expect(useCarpoolCreateStore.getState().draft.departureDate).toBe('2026-10-12');
  });

  it('페이지에 머무는 동안 지난 출발 시각을 선택하면 알림을 표시하고 이동하지 않는다', async () => {
    setCompleteDraft('2026-10-11', 5, '오후');
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(router.push).not.toHaveBeenCalled();
    expect(useSnackbarStore.getState()).toMatchObject({
      open: true,
      description: '출발 시각은 현재 시각 이후로 선택해주세요.',
      type: 'critical',
    });
  });
});
