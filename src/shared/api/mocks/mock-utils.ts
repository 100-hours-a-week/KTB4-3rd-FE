import { HttpResponse } from 'msw';

export const MOCK_SIGNUP_TOKEN = 'mock-signup-token';
export const MOCK_ACCESS_TOKEN = 'mock-access-token';

export function errorResponse(message: string, code: string, field: string | null, status: number) {
  return HttpResponse.json(
    {
      message,
      error: { code, field },
    },
    { status },
  );
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get('authorization');

  return authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : null;
}

export function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get('cookie');
  const cookie = cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

export function isValidNickname(nickname: unknown): nickname is string {
  return typeof nickname === 'string' && /^[가-힣A-Za-z0-9]{2,12}$/.test(nickname);
}
