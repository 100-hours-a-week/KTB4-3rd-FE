import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginRequiredProvider } from '@/_app/providers';
import { useMatchingEntry } from '@/_pages/matching/model/use-matching-entry';
import { useAuthStore } from '@/entities/auth';
import { MatchingFab } from '@/features/matching-entry';
import { useCarpoolCreateStore } from '@/features/carpool-registration';

const navigation = vi.hoisted(() => ({ push: vi.fn<(path: string) => void>() }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => navigation,
}));

function MatchingEntryFixture() {
  const { fabContainerRef, isFabOpen, onFabOpenChange, onCarpoolClick, onTaxipotClick } =
    useMatchingEntry();
  return (
    <>
      <div ref={fabContainerRef}>
        <MatchingFab
          isOpened={isFabOpen}
          onOpenChange={onFabOpenChange}
          onCarpoolClick={onCarpoolClick}
          onTaxipotClick={onTaxipotClick}
        />
      </div>
      <button type="button">지도 영역</button>
    </>
  );
}

function renderEntry() {
  return render(
    <LoginRequiredProvider>
      <MatchingEntryFixture />
    </LoginRequiredProvider>,
  );
}

beforeEach(() => {
  useAuthStore.getState().clearTokens();
  useCarpoolCreateStore.getState().reset();
  navigation.push.mockReset();
});
afterEach(() => {
  cleanup();
  useAuthStore.getState().clearTokens();
  useCarpoolCreateStore.getState().reset();
  vi.restoreAllMocks();
});

async function openMenu() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '매칭 메뉴 열기' }));
  return user;
}

describe('매칭 등록 진입', () => {
  it('부모 상태로 메뉴를 열고 메인 버튼을 다시 눌러 닫는다', async () => {
    renderEntry();
    const user = await openMenu();
    expect(screen.getByRole('button', { name: '카풀 등록' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: '매칭 메뉴 닫기' }));
    expect(screen.queryByRole('button', { name: '카풀 등록' })).not.toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('메뉴 내부 pointerdown은 유지하고 외부 pointerdown은 닫는다', async () => {
    renderEntry();
    await openMenu();
    fireEvent.pointerDown(screen.getByRole('button', { name: '카풀 등록' }));
    expect(screen.getByRole('button', { name: '매칭 메뉴 닫기' })).toBeVisible();
    fireEvent.pointerDown(screen.getByRole('button', { name: '지도 영역' }));
    expect(screen.getByRole('button', { name: '매칭 메뉴 열기' })).toBeVisible();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('Escape로 닫고 메인 버튼에 키보드 focus를 돌려준다', async () => {
    renderEntry();
    const user = await openMenu();
    const carpoolButton = screen.getByRole('button', { name: '카풀 등록' });
    carpoolButton.focus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: '매칭 메뉴 열기' })).toHaveFocus();
    expect(screen.queryByRole('button', { name: '카풀 등록' })).not.toBeInTheDocument();
  });

  it('다른 키나 이미 처리된 Escape로는 닫지 않는다', async () => {
    renderEntry();
    await openMenu();
    fireEvent.keyDown(document, { key: 'Enter' });
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    event.preventDefault();
    act(() => document.dispatchEvent(event));
    expect(screen.getByRole('button', { name: '매칭 메뉴 닫기' })).toBeVisible();
  });

  it.each([
    ['카풀 등록', '/carpools/new'],
    ['택시팟 찾기', '/taxi-pots/new'],
  ])('로그인 후 %s를 누르면 해당 등록 경로로 이동하고 메뉴를 닫는다', async (label, path) => {
    useAuthStore.getState().setAccessToken('test-token');
    renderEntry();
    const user = await openMenu();
    await user.click(screen.getByRole('button', { name: label }));
    expect(navigation.push).toHaveBeenCalledExactlyOnceWith(path);
    expect(screen.getByRole('button', { name: '매칭 메뉴 열기' })).toBeVisible();
    expect(screen.queryByRole('dialog', { name: '로그인이 필요해요' })).not.toBeInTheDocument();
  });

  it('카풀 등록을 새로 시작할 때 초안과 임시 위치를 초기화한다', async () => {
    useAuthStore.getState().setAccessToken('test-token');
    useCarpoolCreateStore.getState().setOrigin({ name: '서울역', lat: 37.55, lng: 126.97 });
    useCarpoolCreateStore.getState().setPendingLocation({
      field: 'departure',
      location: { name: '강남역', lat: 37.49, lng: 127.02 },
      roadAddress: '강남대로',
    });
    renderEntry();
    const user = await openMenu();
    await user.click(screen.getByRole('button', { name: '카풀 등록' }));

    expect(useCarpoolCreateStore.getState().draft.origin).toBeNull();
    expect(useCarpoolCreateStore.getState().pendingLocation).toBeNull();
  });

  it.each(['카풀 등록', '택시팟 찾기'])(
    '비로그인 상태의 %s는 기존 로그인 안내를 연다',
    async (label) => {
      renderEntry();
      const user = await openMenu();
      await user.click(screen.getByRole('button', { name: label }));
      expect(navigation.push).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog', { name: '로그인이 필요해요' })).toBeVisible();
      expect(screen.queryByRole('button', { name: '매칭 메뉴 닫기' })).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: '로그인하러가기' }));
      expect(navigation.push).toHaveBeenCalledExactlyOnceWith('/login');
    },
  );

  it('메뉴를 연 뒤 로그아웃하면 이전 로그인 상태로 등록하지 않는다', async () => {
    useAuthStore.getState().setAccessToken('test-token');
    renderEntry();
    const user = await openMenu();
    act(() => useAuthStore.getState().clearTokens());
    await user.click(screen.getByRole('button', { name: '카풀 등록' }));
    expect(navigation.push).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: '로그인이 필요해요' })).toBeVisible();
  });

  it('외부 클릭으로 닫은 후 다시 열어도 등록 버튼은 정상 동작한다', async () => {
    useAuthStore.getState().setAccessToken('test-token');
    renderEntry();
    const user = await openMenu();
    await user.click(screen.getByRole('button', { name: '지도 영역' }));
    await user.click(screen.getByRole('button', { name: '매칭 메뉴 열기' }));
    await user.click(screen.getByRole('button', { name: '택시팟 찾기' }));
    expect(navigation.push).toHaveBeenCalledExactlyOnceWith('/taxi-pots/new');
  });

  it('메뉴 닫기와 unmount에서 전역 이벤트 리스너를 해제한다', async () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderEntry();
    const user = await openMenu();
    const listeners = add.mock.calls.filter(
      ([type]) => type === 'pointerdown' || type === 'keydown',
    );
    await user.click(screen.getByRole('button', { name: '매칭 메뉴 닫기' }));
    for (const [type, listener, options] of listeners) {
      expect(
        remove.mock.calls.some(
          (call) =>
            call[0] === type &&
            call[1] === listener &&
            call.length === (options === undefined ? 2 : 3) &&
            (options === undefined || call[2] === options),
        ),
      ).toBe(true);
    }
    const reopenStart = add.mock.calls.length;
    await user.click(screen.getByRole('button', { name: '매칭 메뉴 열기' }));
    const activeListeners = add.mock.calls
      .slice(reopenStart)
      .filter(([type]) => type === 'pointerdown' || type === 'keydown');
    unmount();
    for (const [type, listener, options] of activeListeners) {
      expect(
        remove.mock.calls.some(
          (call) =>
            call[0] === type &&
            call[1] === listener &&
            call.length === (options === undefined ? 2 : 3) &&
            (options === undefined || call[2] === options),
        ),
      ).toBe(true);
    }
  });
});
