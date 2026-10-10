import { expect, test, type Page } from '@playwright/test';

const fixedNow = new Date('2026-10-11T09:00:00+09:00');

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
  await page.route('**/api/carpool-pins**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '조회에 성공했습니다',
        data: { items: [], limit: 500, limit_exceeded: false },
      }),
    });
  });
  await page.route('**/api/carpools?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '조회에 성공했습니다',
        data: { items: [], next_cursor: null },
      }),
    });
  });

  await page.addInitScript(() => {
    class FakePlaces {
      keywordSearch(keyword: string, callback: (results: unknown[], status: string) => void) {
        const isDestination = keyword.includes('강남');
        callback(
          [
            {
              id: isDestination ? 'gangnam-1' : 'pangyo-1',
              place_name: isDestination ? '강남역' : '판교역',
              address_name: isDestination ? '서울 강남구 역삼동' : '경기 성남시 분당구 백현동',
              road_address_name: isDestination
                ? '서울 강남구 강남대로'
                : '경기 성남시 분당구 판교역로',
              x: isDestination ? '127.02761234' : '127.11123456',
              y: isDestination ? '37.49791234' : '37.39451234',
            },
          ],
          'OK',
        );
      }
    }

    const fakeKakao = {
      maps: {
        load: (callback: () => void) => callback(),
        services: {
          Places: FakePlaces,
          Geocoder: class {},
          Status: { OK: 'OK', ZERO_RESULT: 'ZERO_RESULT', RESULT_NOT_FOUND: 'RESULT_NOT_FOUND' },
        },
      },
    };
    Object.assign(window, { kakao: fakeKakao });
  });
}

async function completeDraftThroughUi(page: Page) {
  await page.clock.install({ time: fixedNow });
  await mockSession(page);
  await page.goto('/carpools/new/location?field=departure');

  await page.getByRole('textbox', { name: '출발지' }).fill('판교역');
  await page.getByRole('button', { name: '출발 판교역' }).click();
  await expect(page).toHaveURL('/carpools/new/location?field=destination');
  await page.getByRole('textbox', { name: '도착지' }).fill('강남역');
  await page.getByRole('button', { name: '도착 강남역' }).click();
  await expect(page).toHaveURL('/carpools/new/info');

  await page.getByRole('button', { name: '출발 날짜' }).click();
  await page.getByRole('button', { name: '2026년 10월 12일' }).click();
  await page.getByRole('button', { name: '확인' }).click();
  await page.getByRole('button', { name: '출발 시간' }).click();
  await page.getByRole('button', { name: '선택' }).click();
  await page.getByRole('combobox', { name: '모집 인원' }).click();
  await page.getByRole('option', { name: '2명' }).click();
  await page.getByRole('button', { name: '다음' }).click();

  await expect(page).toHaveURL('/carpools/new/confirm');
  await expect(page.getByRole('heading', { name: '이 정보가 맞나요?' })).toBeVisible();
}

test.describe('카풀 등록 확인 경로', () => {
  test('위치부터 확인까지 입력하고 성공한 뒤 매칭으로 이동하며 등록 Snackbar를 보여준다', async ({
    page,
  }) => {
    await completeDraftThroughUi(page);
    let requestCount = 0;
    await page.route('**/api/carpools', async (route) => {
      requestCount += 1;
      expect(route.request().method()).toBe('POST');
      expect(route.request().headers()['authorization']).toBe('Bearer mock-access-token');
      expect(route.request().postDataJSON()).toMatchObject({
        origin_name: '판교역',
        origin_lat: 37.394512,
        origin_lng: 127.111235,
        dest_name: '강남역',
        dest_lat: 37.497912,
        dest_lng: 127.027612,
        departure_at: '2026-10-12T09:40:00.000Z',
        recruit_count: 2,
      });
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          message: '카풀 등록 성공',
          data: { id: 51, chat_room_id: 620, capacity: 3, current_count: 1, status: 'RECRUITING' },
        }),
      });
    });

    await page.getByRole('button', { name: '카풀 등록하기' }).click();
    await expect(page).toHaveURL('/matching');
    await expect(page.getByText('카풀이 등록되었어요.')).toBeVisible();
    expect(requestCount).toBe(1);
  });

  test('서버 오류는 확인 화면과 입력 정보를 유지하고 재시도를 유도하지 않는다', async ({
    page,
  }) => {
    await completeDraftThroughUi(page);
    let requestCount = 0;
    await page.route('**/api/carpools', async (route) => {
      requestCount += 1;
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: '서버 오류' }),
      });
    });

    await page.getByRole('button', { name: '카풀 등록하기' }).click();
    await expect(
      page.getByText('등록 결과를 확인할 수 없어요. 매칭 목록을 확인한 후 다시 시도해주세요.'),
    ).toBeVisible();
    await expect(page).toHaveURL('/carpools/new/confirm');
    await expect(page.getByText('판교역')).toBeVisible();
    await expect(page.getByText('강남역')).toBeVisible();
    expect(requestCount).toBe(1);
  });

  test('출발 시각 검증 오류는 안내를 보여주고 등록 초안과 확인 화면을 유지한다', async ({
    page,
  }) => {
    await completeDraftThroughUi(page);
    let requestCount = 0;
    await page.route('**/api/carpools', async (route) => {
      requestCount += 1;
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          message: '출발 시각을 확인해주세요',
          error: {
            code: 'DEPARTURE_TIME_PASSED',
            field: 'departure_at',
            details: [{ field: 'departure_at', reason: 'PAST' }],
          },
        }),
      });
    });

    await page.getByRole('button', { name: '카풀 등록하기' }).click();

    await expect(page.getByText('출발 시각은 현재 시각 이후로 선택해주세요.')).toBeVisible();
    await expect(page).toHaveURL('/carpools/new/confirm');
    await expect(page.getByText('판교역')).toBeVisible();
    await expect(page.getByText('강남역')).toBeVisible();
    expect(requestCount).toBe(1);
  });

  test('차량 등록이 필요한 오류는 차량 다이얼로그를 임의로 열지 않고 초안을 유지한다', async ({
    page,
  }) => {
    await completeDraftThroughUi(page);
    let requestCount = 0;
    await page.route('**/api/carpools', async (route) => {
      requestCount += 1;
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          message: '차량 등록이 필요합니다',
          error: { code: 'CAR_REGISTRATION_REQUIRED', field: null },
        }),
      });
    });

    await page.getByRole('button', { name: '카풀 등록하기' }).click();

    await expect(page.getByText('차량 정보를 먼저 등록해주세요.')).toBeVisible();
    await expect(page).toHaveURL('/carpools/new/confirm');
    await expect(page.getByText('판교역')).toBeVisible();
    await expect(page.getByText('강남역')).toBeVisible();
    await expect(page.getByRole('dialog', { name: /차량/ })).toHaveCount(0);
    expect(requestCount).toBe(1);
  });

  test('등록 정보가 없는 확인 경로 직접 진입은 위치 입력 단계로 돌아간다', async ({ page }) => {
    await mockSession(page);
    await page.goto('/carpools/new/confirm');

    await expect(page).toHaveURL('/carpools/new');
    await expect(page.getByLabel('카풀 등록 위치 선택')).toBeVisible();
  });
});
