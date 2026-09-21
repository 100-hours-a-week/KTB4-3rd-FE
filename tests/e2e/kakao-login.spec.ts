import { expect, test, type Page } from '@playwright/test';

type KakaoLoginScenario = 'existing-user' | 'new-user' | 'failure';

async function mockKakaoLogin(
  page: Page,
  baseURL: string | undefined,
  scenario: KakaoLoginScenario,
) {
  const callbackUrl = new URL('/auth/callback', baseURL ?? 'http://127.0.0.1:3000');

  if (scenario === 'existing-user') {
    callbackUrl.searchParams.set('status', 'ok');
  }

  if (scenario === 'new-user') {
    callbackUrl.searchParams.set('status', 'signup_required');
  }

  if (scenario === 'failure') {
    callbackUrl.searchParams.set('error', 'access_denied');
    callbackUrl.searchParams.set('error_description', '사용자가 로그인을 취소했습니다');
  }

  await page.route('**/auth/kakao/login', async (route) => {
    const headers: Record<string, string> = { location: callbackUrl.toString() };

    if (scenario === 'existing-user') {
      headers['set-cookie'] = 'refresh_token=mock-access-token; Path=/; HttpOnly; SameSite=Lax';
    }

    if (scenario === 'new-user') {
      headers['set-cookie'] = 'signup_token=mock-signup-token; Path=/; HttpOnly; SameSite=Lax';
    }

    await route.fulfill({ status: 302, headers });
  });
}

test.describe('카카오 로그인 OAuth 콜백', () => {
  test('기존 회원이면 로그인 완료 화면을 보여준다', async ({ page, baseURL }) => {
    await mockKakaoLogin(page, baseURL, 'existing-user');

    await page.goto('/login');
    await page.getByRole('button', { name: '카카오 로그인' }).click();

    await expect(page).toHaveURL(/\/auth\/callback\?status=ok/);
    await expect(page.getByRole('heading', { name: '로그인되었습니다' })).toBeVisible();
  });

  test('신규 회원이면 회원가입 페이지로 이동한다', async ({ page, baseURL }) => {
    await mockKakaoLogin(page, baseURL, 'new-user');

    await page.goto('/login');
    await page.getByRole('button', { name: '카카오 로그인' }).click();

    await expect(page).toHaveURL(/\/signup/);
  });

  test('로그인 실패면 오류 메시지를 보여준다', async ({ page, baseURL }) => {
    await mockKakaoLogin(page, baseURL, 'failure');

    await page.goto('/login');
    await page.getByRole('button', { name: '카카오 로그인' }).click();

    await expect(page).toHaveURL(/\/auth\/callback\?error=access_denied/);
    await expect(
      page.getByRole('heading', { name: '사용자가 로그인을 취소했습니다' }),
    ).toBeVisible();
  });
});
