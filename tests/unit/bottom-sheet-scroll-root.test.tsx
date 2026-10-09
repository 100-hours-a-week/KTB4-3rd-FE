import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BottomSheet } from '@/shared/ui/bottom-sheet';

afterEach(cleanup);

describe('BottomSheet scroll root', () => {
  it('실제 스크롤 콘텐츠 요소를 전달하고 언마운트 때 null을 전달한다', async () => {
    const onChange = vi.fn<(element: HTMLElement | null) => void>();
    const { unmount } = render(
      <BottomSheet defaultOpen onScrollElementChange={onChange}>
        <p>목록</p>
      </BottomSheet>,
    );
    const content = await screen.findByTestId('bottom-sheet-content');
    expect(onChange).toHaveBeenLastCalledWith(content);
    unmount();
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
  it('닫힌 상태에서는 요소를 전달하지 않고 열릴 때 전달한다', async () => {
    const onChange = vi.fn<(element: HTMLElement | null) => void>();
    const { rerender } = render(
      <BottomSheet open={false} onScrollElementChange={onChange}>
        <p>목록</p>
      </BottomSheet>,
    );
    expect(onChange).not.toHaveBeenCalled();
    rerender(
      <BottomSheet open onScrollElementChange={onChange}>
        <p>목록</p>
      </BottomSheet>,
    );
    const content = await screen.findByTestId('bottom-sheet-content');
    expect(onChange).toHaveBeenLastCalledWith(content);
  });
  it('콜백 교체 시 이전 콜백의 참조를 해제하고 새 콜백에 현재 요소를 전달한다', async () => {
    const first = vi.fn<(element: HTMLElement | null) => void>();
    const second = vi.fn<(element: HTMLElement | null) => void>();
    const { rerender } = render(
      <BottomSheet defaultOpen onScrollElementChange={first}>
        <p>목록</p>
      </BottomSheet>,
    );
    const content = await screen.findByTestId('bottom-sheet-content');
    rerender(
      <BottomSheet defaultOpen onScrollElementChange={second}>
        <p>목록</p>
      </BottomSheet>,
    );
    expect(first).toHaveBeenLastCalledWith(null);
    expect(second).toHaveBeenLastCalledWith(content);
  });
  it('같은 콜백과 콘텐츠 요소를 유지하면 무관한 재렌더로 참조를 끊지 않는다', async () => {
    const onChange = vi.fn<(element: HTMLElement | null) => void>();
    const { rerender } = render(
      <BottomSheet defaultOpen onScrollElementChange={onChange}>
        <p>목록</p>
      </BottomSheet>,
    );
    await screen.findByTestId('bottom-sheet-content');
    const count = onChange.mock.calls.length;
    rerender(
      <BottomSheet defaultOpen onScrollElementChange={onChange}>
        <p>새 목록</p>
      </BottomSheet>,
    );
    expect(onChange).toHaveBeenCalledTimes(count);
  });
  it('StrictMode에서도 현재 요소를 전달하고 최종 언마운트 때 해제한다', async () => {
    const onChange = vi.fn<(element: HTMLElement | null) => void>();
    const { unmount } = render(
      <StrictMode>
        <BottomSheet defaultOpen onScrollElementChange={onChange}>
          <p>목록</p>
        </BottomSheet>
      </StrictMode>,
    );
    const content = await screen.findByTestId('bottom-sheet-content');
    expect(onChange).toHaveBeenLastCalledWith(content);
    unmount();
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
  it('닫을 때 이전 스크롤 감지를 해제하고 다시 열 때 새 요소를 전달한다', async () => {
    const onChange = vi.fn<(element: HTMLElement | null) => void>();
    const { rerender } = render(
      <BottomSheet open onScrollElementChange={onChange}>
        <p>목록</p>
      </BottomSheet>,
    );
    const first = await screen.findByTestId('bottom-sheet-content');
    const removeListener = vi.spyOn(first, 'removeEventListener');
    rerender(
      <BottomSheet open={false} onScrollElementChange={onChange}>
        <p>목록</p>
      </BottomSheet>,
    );
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(null));
    expect(removeListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(first.isConnected).toBe(false);
    rerender(
      <BottomSheet open onScrollElementChange={onChange}>
        <p>목록</p>
      </BottomSheet>,
    );
    const second = await screen.findByTestId('bottom-sheet-content');
    expect(second).not.toBe(first);
    expect(onChange).toHaveBeenLastCalledWith(second);
  });
  it('콜백 없이 포털이 늦게 마운트되어도 ScrollFog를 시작한다', async () => {
    render(
      <BottomSheet defaultOpen showScrollFog>
        <p>목록</p>
      </BottomSheet>,
    );
    const content = await screen.findByTestId('bottom-sheet-content');
    Object.defineProperties(content, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 1000 },
      scrollTop: { configurable: true, value: 50 },
    });
    fireEvent.scroll(content);
    await waitFor(() => expect(screen.getByTestId('scroll-fog-top')).toBeInTheDocument());
  });
  it('외부 참조를 전달해도 같은 요소의 ScrollFog 스크롤 감지가 동작한다', async () => {
    const onChange = vi.fn<(element: HTMLElement | null) => void>();
    render(
      <BottomSheet defaultOpen onScrollElementChange={onChange} showScrollFog>
        <p>목록</p>
      </BottomSheet>,
    );
    const content = await screen.findByTestId('bottom-sheet-content');
    Object.defineProperties(content, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 1000 },
      scrollTop: { configurable: true, value: 50 },
    });
    fireEvent.scroll(content);
    await waitFor(() => expect(screen.getByTestId('scroll-fog-top')).toBeInTheDocument());
    expect(screen.getByTestId('scroll-fog-bottom')).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(content);
  });
});
