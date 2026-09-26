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

  await page.route('**/api/auth/kakao/login**', async (route) => {
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
  test('기존 회원이면 홈으로 이동하고 로그인 완료 Snackbar를 보여준다', async ({
    page,
    baseURL,
  }) => {
    await mockKakaoLogin(page, baseURL, 'existing-user');

    await page.goto('/login');
    await page.getByRole('button', { name: '카카오 로그인' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('로그인했어요')).toBeVisible();
  });

  test('신규 회원이면 회원가입 페이지로 이동한다', async ({ page, baseURL }) => {
    await mockKakaoLogin(page, baseURL, 'new-user');

    await page.goto('/login');
    await page.getByRole('button', { name: '카카오 로그인' }).click();

    await expect(page).toHaveURL(/\/signup/);
  });

  test('회원가입 첫 단계에서 성별을 선택할 수 있다', async ({ page, baseURL }) => {
    await mockKakaoLogin(page, baseURL, 'new-user');

    await page.goto('/login');
    await page.getByRole('button', { name: '카카오 로그인' }).click();

    const genderSelect = page.getByRole('combobox', { name: '성별' });
    await expect(genderSelect).toBeVisible();

    await genderSelect.click();
    await page.getByRole('option', { name: '남자' }).click();

    await expect(genderSelect).toHaveText('남자');
  });

  test('회원가입이 완료되면 홈으로 이동하고 완료 Snackbar를 보여준다', async ({
    page,
    baseURL,
  }) => {
    await mockKakaoLogin(page, baseURL, 'new-user');
    await page.route('**/api/users', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 201,
        body: JSON.stringify({
          message: '가입이 완료되었어요',
          data: {
            user_id: 15,
            access_token: 'mock-access-token',
            created_at: '2026-09-06T09:00:00',
          },
        }),
      });
    });
    await page.route('**/api/auth/tokens', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        headers: {
          'set-cookie': 'refresh_token=mock-refresh-token; Path=/; HttpOnly; SameSite=Lax',
        },
        body: JSON.stringify({
          message: '토큰이 재발급되었어요',
          data: { access_token: 'refreshed-access-token' },
        }),
      });
    });

    await page.goto('/login');
    await page.getByRole('button', { name: '카카오 로그인' }).click();

    await page.getByLabel('프로필 이미지 선택 파일').setInputFiles({
      name: 'profile.png',
      mimeType: 'image/png',
      buffer: Buffer.from('profile-image'),
    });
    await page.getByRole('textbox', { name: '닉네임' }).fill('제리');

    const genderSelect = page.getByRole('combobox', { name: '성별' });
    await genderSelect.click();
    await page.getByRole('option', { name: '남자' }).click();
    await page.getByRole('button', { name: '다음' }).click();

    await expect(page).toHaveURL(/\/signup\?step=2/);
    await page.getByRole('checkbox', { name: '전체 동의' }).click();
    await page.getByRole('button', { name: '회원가입하기' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('가입이 완료되었어요')).toBeVisible();
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
