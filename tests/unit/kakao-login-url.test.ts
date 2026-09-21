import { describe, expect, it } from 'vitest';

import { getKakaoLoginUrl } from '@/features/login/model/use-kakao-login';

describe('getKakaoLoginUrl', () => {
  const config = {
    clientId: 'test-rest-api-key',
    redirectUri: 'http://localhost:8080/auth/kakao/callback',
  };

  it('카카오 공식 인가 코드 요청 URL을 생성한다', () => {
    const url = new URL(getKakaoLoginUrl(config));

    expect(url.origin + url.pathname).toBe('https://kauth.kakao.com/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe(config.clientId);
    expect(url.searchParams.get('redirect_uri')).toBe(config.redirectUri);
    expect(url.searchParams.get('response_type')).toBe('code');
  });

  it('필수 환경변수가 없으면 명확한 오류를 반환한다', () => {
    expect(() => getKakaoLoginUrl()).toThrow('카카오 로그인 환경변수가 설정되지 않았습니다');
  });
});
