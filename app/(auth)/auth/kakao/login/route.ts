import { NextResponse } from 'next/server';

const MOCK_SIGNUP_TOKEN = 'mock-signup-token';

export function GET(request: Request) {
  if (process.env.NEXT_PUBLIC_USE_MOCK_API !== 'true') {
    return new NextResponse(null, { status: 404 });
  }

  const callbackUrl = new URL('/auth/callback?status=signup_required', request.url);
  const response = NextResponse.redirect(callbackUrl, { status: 302 });

  response.cookies.set('signup_token', MOCK_SIGNUP_TOKEN, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  return response;
}
