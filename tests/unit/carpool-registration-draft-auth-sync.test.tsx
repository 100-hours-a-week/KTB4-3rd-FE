import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CarpoolRegistrationDraftAuthSync } from '@/_app/providers/carpool-registration-draft-auth-sync';
import { useAuthStore } from '@/entities/auth';
import { useCarpoolCreateStore } from '@/features/carpool-registration';

const { getCurrentUserMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn<(token: string) => Promise<{ data: { id: number } }>>(),
}));
vi.mock('@/entities/user', () => ({ getCurrentUser: getCurrentUserMock }));

const currentUser = (id: number) => ({ data: { id } });
const setDraft = () =>
  useCarpoolCreateStore.getState().setOrigin({ name: '서울역', lat: 37.55, lng: 126.97 });
const startSession = (token: string) => {
  useAuthStore.getState().setAccessToken(token);
  setDraft();
};
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => ((resolve = yes), (reject = no)));
  return { promise, resolve, reject };
};
const resolveIdentity = async (index: number) =>
  act(async () => getCurrentUserMock.mock.results[index].value);

afterEach(() => {
  cleanup();
  getCurrentUserMock.mockReset();
  useAuthStore.getState().clearTokens();
  useCarpoolCreateStore.getState().reset();
});

describe('CarpoolRegistrationDraftAuthSync', () => {
  it('사용자 ID가 확인되지 않으면 실패하더라도 초안을 유지한다', async () => {
    const request = deferred<ReturnType<typeof currentUser>>();
    getCurrentUserMock.mockReturnValue(request.promise);
    startSession('session-a');
    render(<CarpoolRegistrationDraftAuthSync />);

    expect(useCarpoolCreateStore.getState().draft.origin?.name).toBe('서울역');
    request.reject(new Error('network unavailable'));
    await act(async () => request.promise.catch(() => undefined));
    expect(useCarpoolCreateStore.getState().draft.origin?.name).toBe('서울역');
  });

  it('같은 사용자 토큰 갱신은 유지하고 사용자 변경과 로그아웃은 비운다', async () => {
    const userSwitch = deferred<ReturnType<typeof currentUser>>();
    getCurrentUserMock
      .mockResolvedValueOnce(currentUser(1))
      .mockResolvedValueOnce(currentUser(1))
      .mockReturnValueOnce(userSwitch.promise);
    startSession('session-a');
    render(<CarpoolRegistrationDraftAuthSync />);
    await resolveIdentity(0);

    act(() => useAuthStore.getState().setAccessToken('refreshed-session-a'));
    await resolveIdentity(1);
    expect(useCarpoolCreateStore.getState().draft.origin?.name).toBe('서울역');

    act(() => useAuthStore.getState().setAccessToken('session-b'));
    useCarpoolCreateStore.getState().setDestination({ name: '강남역', lat: 37.49, lng: 127.02 });
    userSwitch.resolve(currentUser(2));
    await resolveIdentity(2);
    await waitFor(() => expect(useCarpoolCreateStore.getState().draft.origin).toBeNull());
    expect(useCarpoolCreateStore.getState().draft.destination).toBeNull();

    setDraft();
    act(() => useAuthStore.getState().clearTokens());
    expect(useCarpoolCreateStore.getState().draft.origin).toBeNull();
  });

  it('오래된 identity 응답은 새 세션에서 작성한 draft를 지우지 않는다', async () => {
    const oldRequest = deferred<ReturnType<typeof currentUser>>();
    getCurrentUserMock
      .mockResolvedValueOnce(currentUser(1))
      .mockReturnValueOnce(oldRequest.promise)
      .mockResolvedValueOnce(currentUser(3));
    startSession('session-a');
    render(<CarpoolRegistrationDraftAuthSync />);
    await resolveIdentity(0);

    act(() => useAuthStore.getState().setAccessToken('session-b'));
    act(() => useAuthStore.getState().setAccessToken('session-c'));
    await resolveIdentity(2);
    await waitFor(() => expect(useCarpoolCreateStore.getState().draft.origin).toBeNull());

    setDraft();
    oldRequest.resolve(currentUser(2));
    await act(async () => oldRequest.promise);
    expect(useCarpoolCreateStore.getState().draft.origin?.name).toBe('서울역');
  });
});
