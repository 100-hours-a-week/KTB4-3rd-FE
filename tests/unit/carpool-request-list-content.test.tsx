import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CarpoolRequestListContent,
  type CarpoolRequestListState,
} from '@/_pages/chat-list/ui/carpool-request-list-content';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('CarpoolRequestListContent pagination', () => {
  it('uses the request list scroll area as the observer root and loads before reaching its end', () => {
    let observerCallback: IntersectionObserverCallback | undefined;
    let observerOptions: IntersectionObserverInit | undefined;
    const observe = vi.fn<(target: Element) => void>();
    const disconnect = vi.fn<() => void>();

    vi.stubGlobal(
      'IntersectionObserver',
      class TestIntersectionObserver {
        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          observerCallback = callback;
          observerOptions = options;
        }

        observe = observe;
        unobserve = vi.fn<(target: Element) => void>();
        disconnect = disconnect;
        takeRecords = vi.fn<() => IntersectionObserverEntry[]>();
        root = null;
        rootMargin = '';
        thresholds = [];
      },
    );

    const onLoadMore = vi.fn<() => void>();
    const state: CarpoolRequestListState = {
      status: 'content',
      items: [],
      hasNextPage: true,
      isLoadingMore: false,
      hasLoadMoreError: false,
      canLoadMore: true,
      onLoadMore,
      onRetryLoadMore: vi.fn<() => void>(),
    };

    render(
      <CarpoolRequestListContent
        direction="RECEIVED"
        onChatClick={vi.fn<(chatRoomId: number) => void>()}
        onRequestDecisionClick={vi.fn<
          (carpoolId: number, requestId: number, action: 'accept' | 'reject') => void
        >()}
        onRequestClick={vi.fn<(carpoolId: number, requestId: number) => void>()}
        state={state}
      />,
    );

    const scrollRoot = screen.getByTestId('carpool-request-scroll-root');
    const loadMoreTarget = screen.getByTestId('request-list-load-more-target');
    expect(observerOptions).toMatchObject({
      root: scrollRoot,
      rootMargin: '0px 0px 160px 0px',
      threshold: 0,
    });
    expect(observe).toHaveBeenCalledWith(loadMoreTarget);

    observerCallback?.(
      [{ isIntersecting: true, target: loadMoreTarget } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(onLoadMore).toHaveBeenCalledOnce();
    cleanup();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
