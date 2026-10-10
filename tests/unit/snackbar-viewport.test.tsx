import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SnackbarProvider, SnackbarRouteLifecycle } from '@/_app/providers';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';
import { SnackbarViewport } from '@/shared/ui/snackbar-viewport';

const pathname = vi.hoisted(() => ({ value: '/matching' }));

vi.mock('next/navigation', () => ({
  usePathname: () => pathname.value,
}));

afterEach(() => {
  cleanup();
  useSnackbarStore.getState().reset();
  pathname.value = '/matching';
  vi.useRealTimers();
});

describe('SnackbarViewport', () => {
  it('앱 레이아웃 너비 안에서 토스트를 중앙 정렬한다', () => {
    render(
      <SnackbarProvider>
        <SnackbarViewport />
      </SnackbarProvider>,
    );

    act(() => useSnackbarStore.getState().showSnackbar('가입이 완료되었어요', 'positive'));

    expect(screen.getByRole('region')).toHaveClass('mx-auto', 'w-full', 'max-w-[393px]');
    expect(screen.getByRole('status')).toHaveClass('mx-auto');
  });

  it('positive Snackbar를 3초 후 닫는다', () => {
    vi.useFakeTimers();

    render(
      <SnackbarProvider>
        <SnackbarViewport />
      </SnackbarProvider>,
    );

    act(() => useSnackbarStore.getState().showSnackbar('가입이 완료되었어요', 'positive'));

    expect(useSnackbarStore.getState().open).toBe(true);

    act(() => vi.advanceTimersByTime(2999));
    expect(useSnackbarStore.getState().open).toBe(true);

    act(() => vi.advanceTimersByTime(1));
    expect(useSnackbarStore.getState().open).toBe(false);
  });

  it('viewport가 사라져도 기존 토스트의 타이머를 다시 시작하지 않는다', () => {
    vi.useFakeTimers();

    const { rerender } = render(
      <SnackbarProvider>
        <SnackbarViewport />
      </SnackbarProvider>,
    );

    act(() => useSnackbarStore.getState().showSnackbar('가입이 완료되었어요', 'positive'));
    act(() => vi.advanceTimersByTime(2000));

    rerender(<SnackbarProvider>{null}</SnackbarProvider>);

    act(() => vi.advanceTimersByTime(1000));
    expect(useSnackbarStore.getState().open).toBe(false);
  });

  it('페이지가 변경되면 토스트를 즉시 닫고 타이머를 정리한다', () => {
    vi.useFakeTimers();

    const { rerender } = render(
      <SnackbarProvider>
        <SnackbarRouteLifecycle>
          <SnackbarViewport />
        </SnackbarRouteLifecycle>
      </SnackbarProvider>,
    );

    act(() => useSnackbarStore.getState().showSnackbar('가입이 완료되었어요', 'positive'));
    expect(useSnackbarStore.getState().open).toBe(true);

    pathname.value = '/';
    rerender(
      <SnackbarProvider>
        <SnackbarRouteLifecycle>
          <SnackbarViewport />
        </SnackbarRouteLifecycle>
      </SnackbarProvider>,
    );

    expect(useSnackbarStore.getState().open).toBe(false);

    act(() => vi.advanceTimersByTime(3000));
    expect(useSnackbarStore.getState().open).toBe(false);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
