import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CarPoolList, type CarPoolListItem, type CarPoolListProps } from '@/entities/carpool';

type Content = Extract<CarPoolListProps, { status: 'content' }>;
type Observed = {
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  observe: ReturnType<typeof vi.fn<(target: Element) => void>>;
  disconnect: ReturnType<typeof vi.fn<() => void>>;
};
const observers: Observed[] = [];
const item: CarPoolListItem = {
  id: 10,
  host: { name: '홍길동', profile_image_url: null },
  origin_name: '판교역',
  dest_name: '유스페이스1',
  departure_at: '2026-10-10T09:40:00Z',
  distance_m: 100,
  current_count: 2,
  capacity: 4,
  is_full: false,
  is_expired: false,
};
function content(overrides: Partial<Content> = {}): Content {
  return {
    status: 'content',
    items: [item],
    hasNextPage: true,
    isLoadingMore: false,
    canLoadMore: true,
    scrollRoot: document.createElement('div'),
    onCarpoolClick: vi.fn<(id: number) => void>(),
    onLoadMore: vi.fn<() => void>(),
    ...overrides,
  };
}
function intersect(index = 0, isIntersecting = true) {
  observers[index].callback(
    [{ isIntersecting } as IntersectionObserverEntry],
    {} as IntersectionObserver,
  );
}
beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe = vi.fn<(target: Element) => void>();
      disconnect = vi.fn<() => void>();
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        observers.push({ callback, options, observe: this.observe, disconnect: this.disconnect });
      }
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('CarPoolList', () => {
  it('로딩 중 기존 목록 스켈레톤을 표시한다', () => {
    render(<CarPoolList status="loading" />);
    expect(screen.getByLabelText('주변 카풀을 불러오는 중')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  it('빈 상태를 표시한다', () => {
    render(<CarPoolList status="empty" />);
    expect(screen.getByRole('heading', { name: '주변에 카풀이 없어요' })).toBeInTheDocument();
  });
  it('오류 메시지와 재시도 버튼을 표시한다', async () => {
    const onRetry = vi.fn<() => void>();
    render(<CarPoolList status="error" errorMessage="조회 오류" onRetry={onRetry} />);
    expect(screen.getByText('조회 오류')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다시 불러오기' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
  it('아이템 순서를 유지하고 선택 ID를 상위에 전달한다', async () => {
    const props = content({ items: [item, { ...item, id: 22, origin_name: '강남역' }] });
    render(<CarPoolList {...props} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('판교역 → 유스페이스1');
    expect(buttons[1]).toHaveTextContent('강남역 → 유스페이스1');
    await userEvent.click(buttons[1]);
    expect(props.onCarpoolClick).toHaveBeenCalledExactlyOnceWith(22);
  });
  it('실제 scroll root와 160px 하단 사전 감지 거리를 사용한다', () => {
    const props = content();
    render(<CarPoolList {...props} />);
    expect(observers[0].options).toEqual({
      root: props.scrollRoot,
      rootMargin: '0px 0px 160px 0px',
      threshold: 0,
    });
    expect(observers[0].observe).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });
  it('감지 영역이 보일 때만 조회하고 같은 Observer의 중복 이벤트를 막는다', () => {
    const props = content();
    render(<CarPoolList {...props} />);
    intersect(0, false);
    expect(props.onLoadMore).not.toHaveBeenCalled();
    intersect();
    intersect();
    expect(props.onLoadMore).toHaveBeenCalledOnce();
  });
  it.each([
    { hasNextPage: false },
    { canLoadMore: false },
    { isLoadingMore: true },
    { scrollRoot: null },
  ])('추가 조회 조건이 충족되지 않으면 Observer를 연결하지 않는다: %j', (overrides) => {
    const props = content(overrides);
    render(<CarPoolList {...props} />);
    expect(observers).toHaveLength(0);
    expect(props.onLoadMore).not.toHaveBeenCalled();
  });
  it('scroll root 확보 후 Observer를 연결하고 변경하면 이전 연결을 해제한다', () => {
    const props = content({ scrollRoot: null });
    const { rerender } = render(<CarPoolList {...props} />);
    const firstRoot = document.createElement('div');
    rerender(<CarPoolList {...props} scrollRoot={firstRoot} />);
    expect(observers[0].options?.root).toBe(firstRoot);
    const secondRoot = document.createElement('div');
    rerender(<CarPoolList {...props} scrollRoot={secondRoot} />);
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
    expect(observers[1].options?.root).toBe(secondRoot);
  });
  it('페이지 추가 후에도 감지 영역이 보이면 다음 페이지를 요청할 수 있다', () => {
    const props = content();
    const { rerender } = render(<CarPoolList {...props} />);
    intersect();
    rerender(<CarPoolList {...props} items={[item, { ...item, id: 22 }]} />);
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
    intersect(1);
    expect(props.onLoadMore).toHaveBeenCalledTimes(2);
  });
  it('조회 허용이 해제되면 연결을 끊고 늦게 도착한 이벤트를 무시한다', () => {
    const props = content();
    const { rerender } = render(<CarPoolList {...props} />);
    rerender(<CarPoolList {...props} canLoadMore={false} />);
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
    intersect();
    expect(props.onLoadMore).not.toHaveBeenCalled();
  });
  it('다른 상태로 전환하거나 언마운트하면 Observer를 해제한다', () => {
    const props = content();
    const { rerender, unmount } = render(<CarPoolList {...props} />);
    rerender(<CarPoolList status="empty" />);
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
    rerender(<CarPoolList {...props} />);
    unmount();
    expect(observers[1].disconnect).toHaveBeenCalledOnce();
    intersect(1);
    expect(props.onLoadMore).not.toHaveBeenCalled();
  });
  it('추가 조회 중 목록을 유지하고 하단 로딩 상태를 표시한다', () => {
    render(<CarPoolList {...content({ isLoadingMore: true })} />);
    expect(screen.getByRole('button')).toHaveTextContent('판교역');
    expect(screen.getByRole('status')).toHaveTextContent('카풀을 더 불러오는 중');
  });
  it('Observer가 없는 환경에서는 수동 다음 페이지 버튼을 사용한다', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const props = content();
    const { rerender } = render(<CarPoolList {...props} />);
    await userEvent.click(screen.getByRole('button', { name: '다음 페이지 불러오기' }));
    expect(props.onLoadMore).toHaveBeenCalledOnce();
    rerender(<CarPoolList {...props} canLoadMore={false} />);
    expect(screen.getByRole('button', { name: '다음 페이지 불러오기' })).toBeDisabled();
    rerender(<CarPoolList {...props} hasNextPage={false} />);
    expect(screen.queryByRole('button', { name: '다음 페이지 불러오기' })).not.toBeInTheDocument();
  });
});
