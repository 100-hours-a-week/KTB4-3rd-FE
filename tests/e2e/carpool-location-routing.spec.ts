import { expect, test, type Page } from '@playwright/test';

async function mockSession(page: Page, authenticated: boolean) {
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 37.5547, longitude: 126.9706 });
  await page.route('**/api/auth/tokens', async (route) => {
    await route.fulfill({
      status: authenticated ? 200 : 401,
      contentType: 'application/json',
      body: JSON.stringify(
        authenticated
          ? { message: '토큰 재발급 성공', data: { access_token: 'mock-access-token' } }
          : { message: '로그인이 필요합니다' },
      ),
    });
  });
  await page.route('**/api/users/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '내 정보 조회 성공',
        data: { id: 7, nickname: '제리', profile_image_url: null },
      }),
    });
  });
  await page.route('https://dapi.kakao.com/**', (route) => route.abort());
}

test.describe('카풀 위치 입력 경로', () => {
  test('로그인하지 않은 사용자는 카풀 등록 경로에서 로그인 안내를 본다', async ({ page }) => {
    await mockSession(page, false);
    await page.goto('/carpools/new/location/adjust?field=destination');

    await expect(page.getByRole('dialog', { name: '로그인이 필요해요' })).toBeVisible();
  });

  test('시작 화면에서 검색으로 이동하고 field를 유지한다', async ({ page }) => {
    await mockSession(page, true);
    await page.goto('/carpools/new');

    await expect(page.getByRole('button', { name: '출발지' })).toBeVisible();
    await page.getByRole('button', { name: '도착지' }).click();
    await expect(page).toHaveURL('/carpools/new/location?field=destination');
    await expect(page.getByRole('textbox', { name: '도착지' })).toBeFocused();
  });

  test('임시 위치 없는 조정 경로는 선택 field를 보존해 검색으로 돌아간다', async ({ page }) => {
    await mockSession(page, true);
    await page.goto('/carpools/new/location/adjust?field=destination');

    await expect(page).toHaveURL('/carpools/new/location?field=destination');
    await expect(page.getByRole('textbox', { name: '도착지' })).toBeFocused();
  });

  test('잘못된 field는 departure 검색 경로로 정규화한다', async ({ page }) => {
    await mockSession(page, true);
    await page.goto('/carpools/new/location?field=invalid');

    await expect(page).toHaveURL('/carpools/new/location?field=departure');
    await expect(page.getByRole('textbox', { name: '출발지' })).toBeFocused();
  });
});
