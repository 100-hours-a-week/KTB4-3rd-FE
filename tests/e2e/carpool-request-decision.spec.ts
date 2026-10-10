import { expect, test, type Page } from '@playwright/test';

const receivedRequest = {
  id: 90,
  carpool_id: 53,
  status: 'PENDING',
  content: '판교역에서 같이 가고 싶어요.',
  counterpart: { id: 9, name: '이루디', profile_image_url: null },
  origin_name: '판교역',
  dest_name: '강남역',
  departure_at: '2026-10-12T08:30:00.000Z',
  created_at: '2026-10-10T08:05:00.000Z',
};

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

async function openReceivedRequests(page: Page) {
  await page.getByRole('tab', { name: '카풀' }).click();
  await page.getByRole('tab', { name: '받은 요청' }).click();
  await page.getByRole('button', { name: '요청 확인' }).click();
}

test('받은 카풀 요청의 상세를 새로 확인해 수락하고 목록에서 제거한다', async ({ page }) => {
  await mockSession(page);
  let remaining = [receivedRequest];
  let releaseDetail: (() => void) | undefined;
  let markDetailStarted: (() => void) | undefined;
  const detailStarted = new Promise<void>((resolve) => {
    markDetailStarted = resolve;
  });
  await page.route('**/api/users/me/carpool-requests**', async (route) => {
    const direction = new URL(route.request().url()).searchParams.get('direction');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '조회에 성공했습니다',
        data: { direction, items: direction === 'RECEIVED' ? remaining : [], next_cursor: null },
      }),
    });
  });
  await page.route('**/api/carpools/53/join-requests/90', async (route) => {
    if (route.request().method() === 'GET') {
      markDetailStarted?.();
      await new Promise<void>((resolve) => {
        releaseDetail = resolve;
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: '조회에 성공했습니다',
          data: {
            id: 90,
            carpool_id: 53,
            status: 'PENDING',
            content: '상세에서 다시 확인한 메시지',
            requester: { id: 9, name: '이루디 상세', profile_image_url: null },
            created_at: '2026-10-10T08:10:00.000Z',
          },
        }),
      });
      return;
    }

    expect(route.request().method()).toBe('PATCH');
    expect(route.request().headers()['authorization']).toBe('Bearer mock-access-token');
    expect(route.request().postDataJSON()).toEqual({ status: 'ACCEPTED' });
    remaining = [];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '요청을 수락했습니다',
        data: { id: 90, status: 'ACCEPTED', chat_room_id: 301, current_count: 3, capacity: 4 },
      }),
    });
  });

  await page.goto('/chat');
  await openReceivedRequests(page);
  await expect(page.getByText(receivedRequest.content)).toBeVisible();
  await detailStarted;
  releaseDetail?.();
  await expect(page.getByText('상세에서 다시 확인한 메시지')).toBeVisible();
  await page.getByRole('button', { name: '수락' }).click();

  await expect(page.getByText('요청을 수락했어요.')).toBeVisible();
  await expect(page.getByTestId('carpool-request-list-empty')).toBeVisible();
  await expect(page.getByRole('dialog', { name: '카풀 요청 확인' })).toHaveCount(0);
});

test('긴 받은 요청 메시지는 모바일 상세에서 읽을 수 있고 키보드 초점이 모달 안에서 순환한다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page);
  const longContent = '판교역에서 함께 이동하고 싶어요. '.repeat(8);
  await page.route('**/api/users/me/carpool-requests**', async (route) => {
    const direction = new URL(route.request().url()).searchParams.get('direction');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '조회에 성공했습니다',
        data: {
          direction,
          items: direction === 'RECEIVED' ? [{ ...receivedRequest, content: longContent }] : [],
          next_cursor: null,
        },
      }),
    });
  });
  await page.route('**/api/carpools/53/join-requests/90', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '조회에 성공했습니다',
        data: {
          id: 90,
          carpool_id: 53,
          status: 'PENDING',
          content: longContent,
          requester: { id: 9, name: '이루디', profile_image_url: null },
          created_at: '2026-10-10T08:10:00.000Z',
        },
      }),
    });
  });

  await page.goto('/chat');
  await openReceivedRequests(page);

  const dialog = page.getByRole('dialog', { name: '카풀 요청 확인' });
  const closeButton = dialog.getByRole('button', { name: '닫기' });
  const rejectButton = dialog.getByRole('button', { name: '거절' });
  const acceptButton = dialog.getByRole('button', { name: '수락' });
  await expect(dialog.getByText(longContent)).toBeVisible();
  await expect(rejectButton).toBeVisible();
  await expect(acceptButton).toBeVisible();

  await closeButton.focus();
  await page.keyboard.press('Tab');
  await expect(rejectButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(acceptButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(closeButton).toBeFocused();
});
