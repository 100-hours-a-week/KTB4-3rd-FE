import { describe, expect, it } from 'vitest';

import { getKakaoLoginUrl } from '@/features/login/model/use-kakao-login';

describe('getKakaoLoginUrl', () => {
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
});
