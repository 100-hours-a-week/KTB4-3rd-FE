import { afterEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/entities/auth';

const AUTH_STORAGE_KEY = 'moyeota-auth';

afterEach(() => {
  useAuthStore.getState().clearTokens();
  localStorage.removeItem(AUTH_STORAGE_KEY);
});

describe('useAuthStore', () => {
  it('access token만 localStorage에 저장한다', () => {
    useAuthStore.getState().setAccessToken('persisted-access-token');
    useAuthStore.getState().setSignupToken('temporary-signup-token');

    expect(JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) ?? '{}')).toMatchObject({
      state: { accessToken: 'persisted-access-token' },
    });
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).not.toContain('temporary-signup-token');
  });

  it('localStorage의 access token을 다시 Zustand 상태로 복원한다', async () => {
    useAuthStore.getState().clearTokens();
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ state: { accessToken: 'restored-access-token' }, version: 0 }),
    );

    await useAuthStore.persist.rehydrate();

    expect(useAuthStore.getState().accessToken).toBe('restored-access-token');
  });

  it('토큰을 초기화하면 localStorage의 access token도 제거한다', () => {
    useAuthStore.getState().setAccessToken('persisted-access-token');

    useAuthStore.getState().clearTokens();

    expect(JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) ?? '{}')).toMatchObject({
      state: { accessToken: null },
    });
  });

  it('토큰이 바뀌면 검증된 사용자 ID를 초기화한다', () => {
    useAuthStore.getState().setAccessToken('account-a-token');
    useAuthStore.getState().setVerifiedViewerId('account-a-token', 7);

    useAuthStore.getState().setAccessToken('account-b-token');

    expect(useAuthStore.getState().verifiedViewerId).toBeNull();
  });

  it('현재 토큰에 해당하는 응답만 사용자 ID를 검증 상태로 저장한다', () => {
    useAuthStore.getState().setAccessToken('account-b-token');

    useAuthStore.getState().setVerifiedViewerId('account-a-token', 7);

    expect(useAuthStore.getState().verifiedViewerId).toBeNull();
    useAuthStore.getState().setVerifiedViewerId('account-b-token', 8);
    expect(useAuthStore.getState().verifiedViewerId).toBe(8);
  });
});
