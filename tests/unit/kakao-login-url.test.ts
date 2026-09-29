import { afterEach, describe, expect, it, vi } from 'vitest';

import { getKakaoLoginUrl } from '@/features/login/model/use-kakao-login';

describe('getKakaoLoginUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('백엔드 카카오 로그인 시작 API 경로를 붙인다', () => {
    expect(getKakaoLoginUrl('http://dev.moyeota.com/api')).toBe(
      'http://dev.moyeota.com/api/auth/kakao/login',
    );
  });

  it('API base URL의 마지막 슬래시를 중복해서 붙이지 않는다', () => {
    expect(getKakaoLoginUrl('http://moyeota.com/api/')).toBe(
      'http://moyeota.com/api/auth/kakao/login',
    );
  });

  it('API base URL이 없으면 dev API URL을 기본값으로 사용한다', () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', '');

    expect(getKakaoLoginUrl()).toBe('http://dev.moyeota.com/api/auth/kakao/login');
  });

  it('개발 환경에서는 로컬 프론트 origin을 query로 전달한다', () => {
    vi.stubEnv('NODE_ENV', 'development');

    expect(getKakaoLoginUrl('http://dev.moyeota.com/api')).toBe(
      'http://localhost:3000/api/auth/kakao/login?front_origin=http://localhost:3000',
    );
  });

  it('mock API 모드에서는 로컬 프론트 origin을 query로 전달한다', () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_API', 'true');

    expect(getKakaoLoginUrl()).toBe(
      'http://localhost:3000/api/auth/kakao/login?front_origin=http://localhost:3000',
    );
  });
});
