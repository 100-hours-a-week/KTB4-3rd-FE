import { expect, test, type Page } from '@playwright/test';

const MOCK_ACCESS_TOKEN = 'mock-access-token';
const APP_RENDER_TIMEOUT = 15_000;

type ReportRequest = Record<string, unknown>;

const reportResponse = {
  message: '신고가 접수되었습니다',
  data: { id: 4, created_at: '2026-09-06T09:00:00' },
};

async function fulfillJson(route: Parameters<Parameters<Page['route']>[1]>[0], body: unknown) {
  await route.fulfill({
    contentType: 'application/json',
    status: 200,
    body: JSON.stringify(body),
  });
}

async function setupAuthentication(page: Page) {
  await page.addInitScript((accessToken) => {
    window.localStorage.setItem(
      'moyeota-auth',
      JSON.stringify({ state: { accessToken }, version: 0 }),
    );
  }, MOCK_ACCESS_TOKEN);

  await page.route('**/api/auth/tokens', async (route) => {
    await fulfillJson(route, {
      message: '토큰이 재발급되었습니다',
      data: { access_token: MOCK_ACCESS_TOKEN },
    });
  });

  await page.route('**/api/users/me', async (route) => {
    await fulfillJson(route, {
      message: '내 정보 조회에 성공했습니다',
      data: {
        id: 7,
        nickname: '제리',
        profile_image_url: null,
        has_bank_account: false,
      },
    });
  });
}

async function setupGeneralChat(page: Page) {
  await setupAuthentication(page);

  await page.route('**/api/chat-rooms/501', async (route) => {
    await fulfillJson(route, {
      message: '조회에 성공했습니다',
      data: {
        id: 501,
        companion_id: 10,
        kind: 'GENERAL',
        title: '8시 판교역',
        host_id: 7,
        origin_name: '판교역',
        dest_name: '강남역',
        departure_at: '2026-09-05T08:30:00.000Z',
        current_count: 3,
        capacity: 4,
        companion_status: 'IN_PROGRESS',
        closed_at: null,
        last_read_message_id: 1440,
      },
    });
  });

  await page.route('**/api/chat-rooms/501/messages', async (route) => {
    await fulfillJson(route, {
      message: '조회에 성공했습니다',
      data: {
        items: [
          {
            id: 1441,
            type: 'TEXT',
            content: '3분 뒤 도착합니다',
            sender: { id: 7, nickname: '우림', profile_image_url: null },
            created_at: '2026-09-05T07:41:12.000Z',
          },
        ],
        before_cursor: null,
        after_cursor: null,
      },
    });
  });
}

async function setupReportEndpoint(page: Page) {
  const requests: ReportRequest[] = [];

  await page.route('**/api/reports', async (route) => {
    requests.push(route.request().postDataJSON() as ReportRequest);
    await route.fulfill({
      contentType: 'application/json',
      status: 201,
      body: JSON.stringify(reportResponse),
    });
  });

  return requests;
}

async function setupTaxiPotChat(page: Page) {
  await setupAuthentication(page);

  await page.route('**/api/chat-rooms/599', async (route) => {
    await fulfillJson(route, {
      message: '조회에 성공했습니다',
      data: {
        id: 599,
        companion_id: 30,
        kind: 'TAXI_POT',
        title: '5시 판교역',
        host_id: 7,
        origin_name: '판교역',
        dest_name: '강남역',
        departure_at: '2026-09-05T08:30:00.000Z',
        current_count: 2,
        capacity: 4,
        companion_status: 'IN_PROGRESS',
        closed_at: null,
        last_read_message_id: null,
        participants: [{ id: 9, nickname: '루디' }],
      },
    });
  });

  await page.route('**/api/chat-rooms/599/messages', async (route) => {
    await fulfillJson(route, {
      message: '조회에 성공했습니다',
      data: { items: [], before_cursor: null, after_cursor: null },
    });
  });

  await page.route('**/api/taxi-pots/30', async (route) => {
    const status = route.request().method() === 'PATCH' ? 'COMPLETED' : 'IN_PROGRESS';
    const currentCount = status === 'COMPLETED' ? 4 : 1;

    await fulfillJson(route, {
      message: '운행 상태가 변경됐어요',
      data: {
        id: 30,
        chat_room_id: 599,
        status,
        origin_name: '판교역',
        dest_name: '강남역',
        departure_at: '2026-09-05T08:30:00.000Z',
        current_count: currentCount,
        capacity: 4,
        host_id: 7,
      },
    });
  });
}

async function setupRideEndWebSocket(page: Page) {
  await page.routeWebSocket(
    (url) => url.pathname.endsWith('/api/wss'),
    (webSocket) => {
      webSocket.onMessage((message) => {
        const frame = String(message);

        if (frame.startsWith('CONNECT') || frame.startsWith('STOMP')) {
          webSocket.send('CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0');
          return;
        }

        if (frame.startsWith('SUBSCRIBE')) {
          webSocket.send(
            [
              'MESSAGE',
              'destination:/sub/chat/599',
              'subscription:chat-subscription',
              'message-id:2001',
              'content-type:application/json',
              '',
              JSON.stringify({
                id: 2001,
                type: 'SYSTEM_RIDE_END_REQUESTED',
                created_at: '2026-09-05T08:10:00.000Z',
              }),
              '\0',
            ].join('\n'),
          );
        }
      });
    },
  );
}

test.describe('신고 E2E', () => {
  test('메시지 신고는 reported_message_id를 전송한다', async ({ page }) => {
    await setupGeneralChat(page);
    const requests = await setupReportEndpoint(page);

    await page.goto('/chatroom/501', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('3분 뒤 도착합니다')).toBeVisible({
      timeout: APP_RENDER_TIMEOUT,
    });

    await page.getByLabel('메시지 메뉴 열기').first().click();
    await page.getByRole('menuitem', { name: '채팅 신고하기' }).click();
    await page.getByRole('button', { name: '신고하기' }).click();

    await expect(page.getByRole('dialog', { name: '신고 사유를 선택해주세요' })).toBeHidden();
    expect(requests).toEqual([
      {
        reason: 'ABUSE',
        reason_text: null,
        reported_message_id: 1441,
        reported_user_id: 7,
      },
    ]);
  });

  test('유저 신고는 companion_id를 전송한다', async ({ page }) => {
    await setupGeneralChat(page);
    const requests = await setupReportEndpoint(page);

    await page.goto('/chatroom/501', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('3분 뒤 도착합니다')).toBeVisible({
      timeout: APP_RENDER_TIMEOUT,
    });

    await page.getByLabel('메시지 메뉴 열기').first().click();
    await page.getByRole('menuitem', { name: '유저 신고하기' }).click();
    await page.getByRole('radio', { name: '노쇼' }).click();
    await page.getByRole('button', { name: '신고하기' }).click();

    await expect(page.getByRole('dialog', { name: '신고 사유를 선택해주세요' })).toBeHidden();
    expect(requests).toEqual([
      {
        companion_id: 10,
        reason: 'NO_SHOW',
        reason_text: null,
        reported_user_id: 7,
      },
    ]);
  });

  test('만족도 화면의 유저 신고는 companion_id를 전송한다', async ({ page }) => {
    await setupTaxiPotChat(page);
    await setupRideEndWebSocket(page);
    const requests = await setupReportEndpoint(page);

    await page.goto('/chatroom/599', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('운행이 종료됐나요?')).toBeVisible({
      timeout: APP_RENDER_TIMEOUT,
    });
    await page.getByRole('button', { name: '확인' }).click();

    await expect(page.getByRole('dialog', { name: '만족도를 입력해주세요.' })).toBeVisible();
    await page.getByRole('button', { name: '루디 신고하기' }).click();
    await page.getByRole('radio', { name: '노쇼' }).click();
    await page.getByRole('button', { name: '신고하기' }).click();

    await expect(page.getByRole('dialog', { name: '신고 사유를 선택해주세요' })).toBeHidden();
    expect(requests).toEqual([
      {
        companion_id: 30,
        reason: 'NO_SHOW',
        reason_text: null,
        reported_user_id: 9,
      },
    ]);
  });
});
