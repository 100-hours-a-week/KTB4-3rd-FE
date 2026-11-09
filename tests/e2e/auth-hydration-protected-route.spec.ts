import { expect, test } from '@playwright/test';

const MOCK_ACCESS_TOKEN = 'mock-access-token';

test('로그인 세션 복원 중 보호 경로에 진입해도 로그인 안내가 먼저 뜨지 않는다', async ({
  page,
}) => {
  await page.addInitScript((accessToken) => {
    window.localStorage.setItem(
      'moyeota-auth',
      JSON.stringify({ state: { accessToken }, version: 0 }),
    );
  }, MOCK_ACCESS_TOKEN);

  let releaseRefresh!: () => void;
  const refreshGate = new Promise<void>((resolve) => {
    releaseRefresh = resolve;
  });

  await page.route('**/api/auth/tokens', async (route) => {
    await refreshGate;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '토큰 재발급 성공',
        data: { access_token: MOCK_ACCESS_TOKEN },
      }),
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
  await page.route('**/api/chat-rooms**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '조회에 성공했습니다',
        data: { items: [], next_cursor: null },
      }),
    });
  });

  await page.goto('/chat');

  await expect(page).toHaveURL('/chat');
  await expect(page.getByRole('dialog', { name: '로그인이 필요해요' })).toHaveCount(0);

  releaseRefresh();

  await expect(page.getByRole('tablist', { name: '채팅 화면' }).first()).toBeVisible();
  await expect(page.getByRole('dialog', { name: '로그인이 필요해요' })).toHaveCount(0);
});
