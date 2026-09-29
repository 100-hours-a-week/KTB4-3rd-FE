'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type ScrollFogProps = {
  showBottom?: boolean;
  showTop?: boolean;
};

const SCROLL_EPSILON = 1;

type ScrollFogState = {
  showBottom: boolean;
  showTop: boolean;
};

const INITIAL_SCROLL_FOG_STATE: ScrollFogState = {
  showBottom: false,
  showTop: false,
};

export function useScrollFog(contentKey?: string | number) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollFogState, setScrollFogState] = useState(INITIAL_SCROLL_FOG_STATE);

  const updateScrollFogState = useCallback(() => {
    const scrollElement = scrollRef.current;

    if (!scrollElement) {
      return;
    }

    const hasScrollableContent =
      scrollElement.scrollHeight - scrollElement.clientHeight > SCROLL_EPSILON;
    const nextState: ScrollFogState = {
      showBottom:
        hasScrollableContent &&
        scrollElement.scrollTop + scrollElement.clientHeight <
          scrollElement.scrollHeight - SCROLL_EPSILON,
      showTop: hasScrollableContent && scrollElement.scrollTop > SCROLL_EPSILON,
    };

    setScrollFogState((previousState) =>
      previousState.showBottom === nextState.showBottom &&
      previousState.showTop === nextState.showTop
        ? previousState
        : nextState,
    );
  }, []);

  useEffect(() => {
    const scrollElement = scrollRef.current;

    if (!scrollElement) {
      return;
    }

    updateScrollFogState();
    scrollElement.addEventListener('scroll', updateScrollFogState, { passive: true });

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateScrollFogState);
    resizeObserver?.observe(scrollElement);

    return () => {
      scrollElement.removeEventListener('scroll', updateScrollFogState);
      resizeObserver?.disconnect();
    };
  }, [contentKey, updateScrollFogState]);

  return { scrollRef, ...scrollFogState };
}

export function ScrollFog({ showBottom = true, showTop = true }: ScrollFogProps) {
  return (
    <>
      {showTop ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[84px] bg-[linear-gradient(180deg,rgb(255,255,255)_0%,rgba(255,255,255,0.988)_8%,rgba(255,255,255,0.98)_16%,rgba(255,255,255,0.949)_22%,rgba(255,255,255,0.922)_29%,rgba(255,255,255,0.871)_35%,rgba(255,255,255,0.82)_41%,rgba(255,255,255,0.749)_47%,rgba(255,255,255,0.678)_53%,rgba(255,255,255,0.6)_59%,rgba(255,255,255,0.522)_65%,rgba(255,255,255,0.42)_71%,rgba(255,255,255,0.329)_78%,rgba(255,255,255,0.22)_84%,rgba(255,255,255,0.11)_92%,rgba(255,255,255,0)_100%)]"
          data-testid="scroll-fog-top"
        />
      ) : null}
      {showBottom ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[84px] bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.012)_8%,rgba(255,255,255,0.02)_16%,rgba(255,255,255,0.051)_22%,rgba(255,255,255,0.078)_29%,rgba(255,255,255,0.129)_35%,rgba(255,255,255,0.18)_41%,rgba(255,255,255,0.251)_47%,rgba(255,255,255,0.322)_53%,rgba(255,255,255,0.4)_59%,rgba(255,255,255,0.478)_65%,rgba(255,255,255,0.58)_71%,rgba(255,255,255,0.671)_78%,rgba(255,255,255,0.78)_84%,rgba(255,255,255,0.89)_92%,rgb(255,255,255)_100%)]"
          data-testid="scroll-fog-bottom"
        />
      ) : null}
    </>
  );
}
