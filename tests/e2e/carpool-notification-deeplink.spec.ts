import { expect, test, type Page } from '@playwright/test';

async function mockSession(page: Page) {
  await page.route('**/api/auth/tokens', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '토큰 재발급 성공',
        data: { access_token: 'mock-access-token' },
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
}

test('알림에서 받은 카풀 요청을 열면 현재 화면의 탭도 딥링크와 동기화한다', async ({ page }) => {
  await mockSession(page);

  await page.route('**/api/notifications**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === 'GET' && url.pathname.endsWith('/notifications')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: '조회에 성공했습니다',
          data: {
            notifications: [
              {
                id: 900,
                type: 'CARPOOL_REQUEST_RECEIVED',
                event_id: 12,
                target_chat_room_id: null,
                target_post_id: null,
                content: '민준님이 동승을 요청했어요',
                read_at: null,
                created_at: '2026-10-12T08:05:00.000Z',
              },
            ],
            next_cursor: null,
          },
        }),
      });
      return;
    }

    if (request.method() === 'PATCH' && url.pathname.endsWith('/read_at')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: '읽음 처리되었습니다',
          data: { read_at: '2026-10-12T08:06:00.000Z' },
        }),
      });
      return;
    }

    await route.continue();
  });

  await page.route('**/api/users/me/carpool-requests**', async (route) => {
    const direction = new URL(route.request().url()).searchParams.get('direction');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '조회에 성공했습니다',
        data: { direction, items: [], next_cursor: null },
      }),
    });
  });

  await page.goto('/notification');
  await page.getByRole('button', { name: /민준님이 동승을 요청했어요/ }).click();

  await expect(page).toHaveURL('/chat?tab=carpool&direction=RECEIVED');
  const chatTabs = page.getByRole('tablist', { name: '채팅 화면' });
  await expect(chatTabs.getByRole('tab', { name: '카풀' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const requestTabs = page.getByRole('tablist', { name: '카풀 요청 방향' });
  await expect(requestTabs.getByRole('tab', { name: '받은 요청' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});
