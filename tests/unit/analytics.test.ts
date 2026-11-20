import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clarityInit: vi.fn<() => void>(),
}));
const analyticsWindow = window as Window & { dataLayer?: unknown[] };

vi.mock('@microsoft/clarity', () => ({
  default: { init: mocks.clarityInit },
}));

afterEach(() => {
  mocks.clarityInit.mockReset();
  delete analyticsWindow.dataLayer;
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe('analytics', () => {
  it('does not initialize Clarity without a project ID', async () => {
    vi.stubEnv('NEXT_PUBLIC_CLARITY_PROJECT_ID', '');
    const { initClarity } = await import('@/shared/analytics');

    await initClarity();

    expect(mocks.clarityInit).not.toHaveBeenCalled();
  });

  it('initializes Clarity with the configured project ID', async () => {
    vi.stubEnv('NEXT_PUBLIC_CLARITY_PROJECT_ID', 'clarity-project');
    const { initClarity } = await import('@/shared/analytics');

    await Promise.all([initClarity(), initClarity()]);

    expect(mocks.clarityInit).toHaveBeenCalledOnce();
    expect(mocks.clarityInit).toHaveBeenCalledWith('clarity-project');
  });

  it('does not send GA events without a measurement ID', async () => {
    vi.stubEnv('NEXT_PUBLIC_GA_ID', '');
    const { sendAnalyticsEvent } = await import('@/shared/analytics');

    sendAnalyticsEvent('chat_room_enter');

    expect(analyticsWindow.dataLayer).toBeUndefined();
  });

  it('sends only the typed event name and supplied safe parameters', async () => {
    vi.stubEnv('NEXT_PUBLIC_GA_ID', 'G-test');
    const { sendAnalyticsEvent } = await import('@/shared/analytics');

    sendAnalyticsEvent('home_item_click', { item_type: 'community' });

    expect(analyticsWindow.dataLayer).toEqual([
      ['event', 'home_item_click', { item_type: 'community' }],
    ]);
  });

  it('Clarity 초기화 실패 뒤 다시 시도할 수 있다', async () => {
    vi.stubEnv('NEXT_PUBLIC_CLARITY_PROJECT_ID', 'clarity-project');
    mocks.clarityInit.mockImplementationOnce(() => {
      throw new Error('initialization failed');
    });
    const { initClarity } = await import('@/shared/analytics');

    await expect(initClarity()).rejects.toThrow('initialization failed');
    await expect(initClarity()).resolves.toBeUndefined();
    expect(mocks.clarityInit).toHaveBeenCalledTimes(2);
  });

  it('GA 스크립트가 아직 로드되지 않아도 기존 대기열에 이벤트를 추가한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_GA_ID', 'G-test');
    const initialCommands = [['config', 'G-test']];
    analyticsWindow.dataLayer = [...initialCommands];
    const { sendAnalyticsEvent } = await import('@/shared/analytics');

    sendAnalyticsEvent('chat_room_enter');

    expect(analyticsWindow.dataLayer).toEqual([
      ...initialCommands,
      ['event', 'chat_room_enter', {}],
    ]);
  });
});
