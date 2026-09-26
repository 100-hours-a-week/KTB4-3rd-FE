'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
