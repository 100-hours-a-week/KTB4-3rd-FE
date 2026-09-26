import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';
import { SnackbarViewport } from '@/shared/ui/snackbar-viewport';

afterEach(() => {
  cleanup();
  useSnackbarStore.getState().reset();
  vi.useRealTimers();
});

describe('SnackbarViewport', () => {
  it('positive Snackbar를 3초 후 닫는다', () => {
    vi.useFakeTimers();
    useSnackbarStore.getState().showSnackbar('가입이 완료되었어요', 'positive');

    render(<SnackbarViewport />);

    expect(useSnackbarStore.getState().open).toBe(true);

    act(() => vi.advanceTimersByTime(2999));
    expect(useSnackbarStore.getState().open).toBe(true);

    act(() => vi.advanceTimersByTime(1));
    expect(useSnackbarStore.getState().open).toBe(false);
  });
});
