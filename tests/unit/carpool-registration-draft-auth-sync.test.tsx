import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CarpoolRegistrationDraftAuthSync } from '@/_app/providers/carpool-registration-draft-auth-sync';
import { useAuthStore } from '@/entities/auth';
import { useCarpoolCreateStore } from '@/features/carpool-registration';

type CurrentUserResult = { data: { id: number } };

const { getCurrentUserMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn<(token: string) => Promise<CurrentUserResult>>(),
}));

vi.mock('@/entities/user', () => ({ getCurrentUser: getCurrentUserMock }));

function setDraft() {
  useCarpoolCreateStore.getState().setOrigin({ name: '서울역', lat: 37.55, lng: 126.97 });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function currentUser(id: number): CurrentUserResult {
  return { data: { id } };
}

beforeEach(() => {
  getCurrentUserMock.mockReset();
  useAuthStore.getState().clearTokens();
  useCarpoolCreateStore.getState().reset();
});

afterEach(() => cleanup());

describe('CarpoolRegistrationDraftAuthSync', () => {
  it('사용자 ID가 확인되기 전이나 확인 요청이 실패한 동안 초안을 유지한다', async () => {
    const identityRequest = deferred<ReturnType<typeof currentUser>>();
    getCurrentUserMock.mockReturnValue(identityRequest.promise);
    useAuthStore.getState().setAccessToken('session-a');
    setDraft();

    render(<CarpoolRegistrationDraftAuthSync />);

    expect(useCarpoolCreateStore.getState().draft.origin?.name).toBe('서울역');
    identityRequest.reject(new Error('network unavailable'));
    await waitFor(() => expect(getCurrentUserMock).toHaveBeenCalledWith('session-a'));
    await act(async () => identityRequest.promise.catch(() => undefined));

    expect(useCarpoolCreateStore.getState().draft.origin?.name).toBe('서울역');
  });

  it('로그아웃에서 비우고, 같은 사용자 토큰 갱신에서는 유지하며, 사용자 ID 변경에서 비운다', async () => {
    getCurrentUserMock.mockResolvedValueOnce(currentUser(1)).mockResolvedValueOnce(currentUser(1));
    useAuthStore.getState().setAccessToken('session-a');
    setDraft();
    render(<CarpoolRegistrationDraftAuthSync />);

    await waitFor(() => expect(getCurrentUserMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(useCarpoolCreateStore.getState().draft.origin?.name).toBe('서울역'));

    act(() => useAuthStore.getState().setAccessToken('refreshed-session-a'));
    await waitFor(() => expect(getCurrentUserMock).toHaveBeenCalledTimes(2));
    expect(useCarpoolCreateStore.getState().draft.origin?.name).toBe('서울역');

    getCurrentUserMock.mockResolvedValueOnce(currentUser(2));
    act(() => useAuthStore.getState().setAccessToken('session-b'));
    await waitFor(() => expect(getCurrentUserMock).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(useCarpoolCreateStore.getState().draft.origin).toBeNull());

    setDraft();
    act(() => useAuthStore.getState().clearTokens());
    expect(useCarpoolCreateStore.getState().draft.origin).toBeNull();
  });

  it('오래된 사용자 확인 응답은 최신 세션의 새 초안을 초기화하지 않는다', async () => {
    const oldSessionRequest = deferred<ReturnType<typeof currentUser>>();
    getCurrentUserMock
      .mockResolvedValueOnce(currentUser(1))
      .mockReturnValueOnce(oldSessionRequest.promise)
      .mockResolvedValueOnce(currentUser(3));
    useAuthStore.getState().setAccessToken('session-a');
    setDraft();
    render(<CarpoolRegistrationDraftAuthSync />);
    await waitFor(() => expect(getCurrentUserMock).toHaveBeenCalledTimes(1));

    act(() => useAuthStore.getState().setAccessToken('session-b'));
    await waitFor(() => expect(getCurrentUserMock).toHaveBeenCalledTimes(2));
    act(() => useAuthStore.getState().setAccessToken('session-c'));
    await waitFor(() => expect(getCurrentUserMock).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(useCarpoolCreateStore.getState().draft.origin).toBeNull());

    setDraft();
    oldSessionRequest.resolve(currentUser(2));
    await act(async () => oldSessionRequest.promise);

    expect(useCarpoolCreateStore.getState().draft.origin?.name).toBe('서울역');
  });
});
