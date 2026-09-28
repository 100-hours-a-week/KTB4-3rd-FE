import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clarityInit: vi.fn<() => void>(),
  sendGAEvent: vi.fn<(command: string, name: string, params: Record<string, unknown>) => void>(),
}));

vi.mock('@microsoft/clarity', () => ({
  default: { init: mocks.clarityInit },
}));

vi.mock('@next/third-parties/google', () => ({
  sendGAEvent: mocks.sendGAEvent,
}));

afterEach(() => {
  mocks.clarityInit.mockReset();
  mocks.sendGAEvent.mockReset();
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe('analytics', () => {
  it('does not initialize Clarity without a project ID', async () => {
    vi.stubEnv('NEXT_PUBLIC_CLARITY_PROJECT_ID', '');
    const { initClarity } = await import('@/shared/analytics');

    initClarity();

    expect(mocks.clarityInit).not.toHaveBeenCalled();
  });

  it('initializes Clarity with the configured project ID', async () => {
    vi.stubEnv('NEXT_PUBLIC_CLARITY_PROJECT_ID', 'clarity-project');
    const { initClarity } = await import('@/shared/analytics');

    initClarity();
    initClarity();

    expect(mocks.clarityInit).toHaveBeenCalledOnce();
    expect(mocks.clarityInit).toHaveBeenCalledWith('clarity-project');
  });

  it('does not send GA events without a measurement ID', async () => {
    vi.stubEnv('NEXT_PUBLIC_GA_ID', '');
    const { sendAnalyticsEvent } = await import('@/shared/analytics');

    sendAnalyticsEvent('chat_room_enter');

    expect(mocks.sendGAEvent).not.toHaveBeenCalled();
  });

  it('sends only the typed event name and supplied safe parameters', async () => {
    vi.stubEnv('NEXT_PUBLIC_GA_ID', 'G-test');
    const { sendAnalyticsEvent } = await import('@/shared/analytics');

    sendAnalyticsEvent('home_item_click', { item_type: 'community' });

    expect(mocks.sendGAEvent).toHaveBeenCalledWith('event', 'home_item_click', {
      item_type: 'community',
    });
  });
});
