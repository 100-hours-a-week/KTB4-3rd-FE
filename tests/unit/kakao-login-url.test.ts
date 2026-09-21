import { afterEach, describe, expect, it, vi } from 'vitest';

import { getKakaoLoginUrl } from '@/features/login/model/use-kakao-login';

describe('getKakaoLoginUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('백엔드 카카오 로그인 시작 API 경로를 붙인다', () => {
    expect(getKakaoLoginUrl('http://localhost:8080')).toBe(
      'http://localhost:8080/auth/kakao/login',
    );
  });

  it('API base URL의 마지막 슬래시를 중복해서 붙이지 않는다', () => {
    expect(getKakaoLoginUrl('https://api.moyeota.com/')).toBe(
      'https://api.moyeota.com/auth/kakao/login',
    );
  });

  it('mock API 모드에서는 프론트 origin의 상대 경로를 사용한다', () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_API', 'true');

    expect(getKakaoLoginUrl()).toBe('/auth/kakao/login');
  });
});
