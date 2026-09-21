import { afterEach, describe, expect, it, vi } from 'vitest';

const { start } = vi.hoisted(() => ({
  start: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

vi.mock('msw/browser', () => ({
  setupWorker: () => ({ start }),
}));

describe('startMockApi', () => {
  afterEach(() => {
    vi.resetModules();
    start.mockClear();
  });

  it('동시에 여러 번 호출해도 MSW worker를 한 번만 시작한다', async () => {
    const { startMockApi } = await import('@/shared/api/mocks/browser');

    await Promise.all([startMockApi(), startMockApi()]);

    expect(start).toHaveBeenCalledOnce();
  });
});
