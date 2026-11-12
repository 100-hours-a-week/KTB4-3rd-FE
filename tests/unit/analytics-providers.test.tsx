import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ClarityProvider } from '@/_app/providers/clarity-provider';
import { GoogleAnalytics } from '@/_app/providers/google-analytics';

const { initClarity } = vi.hoisted(() => ({ initClarity: vi.fn<() => Promise<void>>() }));
vi.mock('@/shared/analytics', () => ({ initClarity }));
vi.mock('next/script', () => ({
  default: ({
    dangerouslySetInnerHTML,
    id,
    src,
    strategy,
  }: {
    dangerouslySetInnerHTML?: { __html: string };
    id: string;
    src?: string;
    strategy: string;
  }) => (
    <div
      data-mock-script
      data-script-content={dangerouslySetInnerHTML?.__html}
      data-src={src}
      data-strategy={strategy}
      id={id}
    />
  ),
}));

beforeEach(() => {
  initClarity.mockResolvedValue();
});

afterEach(() => {
  cleanup();
  initClarity.mockReset();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('지연 분석 스크립트', () => {
  it('GA 초기 명령은 미리 대기열에 넣고 외부 스크립트는 지연한다', () => {
    const { container } = render(<GoogleAnalytics gaId="G-test" />);
    const init = container.querySelector('#google-analytics-init');
    const external = container.querySelector('#google-analytics-script');

    expect(init).toHaveAttribute('data-strategy', 'beforeInteractive');
    expect(init?.getAttribute('data-script-content')).toContain('send_page_view: false');
    expect(init?.getAttribute('data-script-content')).toContain("gtag('event', 'page_view'");
    expect(external).toHaveAttribute('data-strategy', 'lazyOnload');
    expect(external).toHaveAttribute(
      'data-src',
      'https://www.googletagmanager.com/gtag/js?id=G-test',
    );
  });

  it('GA ID에 HTML이 포함돼도 초기화 스크립트를 벗어나지 않는다', () => {
    const unsafeId = '</script><script>bad()</script>';
    const { container } = render(<GoogleAnalytics gaId={unsafeId} />);

    expect(container.querySelectorAll('[data-mock-script]')).toHaveLength(2);
    expect(
      container.querySelector('#google-analytics-init')?.getAttribute('data-script-content'),
    ).not.toContain('</script>');
  });

  it('Clarity는 문서가 로드된 뒤 유휴 시간에 초기화한다', () => {
    vi.stubEnv('NEXT_PUBLIC_CLARITY_PROJECT_ID', 'clarity-project');
    const readyState = vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
    const requestIdle = vi.fn<
      (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
    >(() => 7);
    vi.stubGlobal('requestIdleCallback', requestIdle);
    vi.stubGlobal('cancelIdleCallback', vi.fn());
    render(<ClarityProvider>화면</ClarityProvider>);

    expect(screen.getByText('화면')).toBeInTheDocument();
    expect(requestIdle).not.toHaveBeenCalled();
    expect(initClarity).not.toHaveBeenCalled();
    readyState.mockReturnValue('complete');
    act(() => window.dispatchEvent(new Event('load')));
    expect(requestIdle).toHaveBeenCalledWith(expect.any(Function), { timeout: 3000 });
    expect(initClarity).not.toHaveBeenCalled();

    const callback = requestIdle.mock.calls[0]?.[0];
    act(() => callback?.({ didTimeout: false, timeRemaining: () => 20 }));
    expect(initClarity).toHaveBeenCalledOnce();
  });

  it('Clarity의 예약된 유휴 작업을 unmount 시 취소한다', () => {
    vi.stubEnv('NEXT_PUBLIC_CLARITY_PROJECT_ID', 'clarity-project');
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('complete');
    vi.stubGlobal('requestIdleCallback', () => 7);
    const cancelIdle = vi.fn<(handle: number) => void>();
    vi.stubGlobal('cancelIdleCallback', cancelIdle);
    const { unmount } = render(<ClarityProvider>화면</ClarityProvider>);

    unmount();

    expect(cancelIdle).toHaveBeenCalledWith(7);
    expect(initClarity).not.toHaveBeenCalled();
  });

  it('유휴 콜백이 없으면 문서 로딩 후 타이머로 Clarity를 초기화한다', () => {
    vi.useFakeTimers();
    vi.stubEnv('NEXT_PUBLIC_CLARITY_PROJECT_ID', 'clarity-project');
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('complete');
    vi.stubGlobal('requestIdleCallback', undefined);
    render(<ClarityProvider>화면</ClarityProvider>);

    act(() => vi.advanceTimersByTime(999));
    expect(initClarity).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(initClarity).toHaveBeenCalledOnce();
  });
});
