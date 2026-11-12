import { expect, test, type Page } from '@playwright/test';

const TAXI_POT_CREATE_PATH = '/taxi-pots/new';
const LEGACY_ROUTE_SUFFIXES = ['/location', '/location/adjust', '/time', '/confirm'];

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
        data: { id: 7, nickname: '제리', profile_image_url: null, has_bank_account: true },
      }),
    });
  });
  await page.route('**/moyeota-kakao-map-sdk/**', (route) => route.abort());
}

test.describe('택시팟 등록 경로', () => {
  for (const suffix of LEGACY_ROUTE_SUFFIXES) {
    test(`기존 ${suffix} 경로는 쿼리를 보존해 새 경로로 이동한다`, async ({ request }) => {
      const query = '?field=destination&tag=one&tag=two&label=%EC%84%9C%EC%9A%B8';
      const response = await request.get(`/matching${suffix}${query}`, { maxRedirects: 0 });

      expect(response.status()).toBe(307);
      const location = new URL(response.headers().location, response.url());
      expect(location.pathname).toBe(`${TAXI_POT_CREATE_PATH}${suffix}`);
      expect(location.searchParams.get('field')).toBe('destination');
      expect(location.searchParams.getAll('tag')).toEqual(['one', 'two']);
      expect(location.searchParams.get('label')).toBe('서울');
    });
  }

  test('/matching 루트는 택시팟 경로로 리다이렉트하지 않는다', async ({ request }) => {
    const response = await request.get('/matching', { maxRedirects: 0 });

    expect(response.status()).toBe(200);
    expect(response.headers().location).toBeUndefined();
  });

  for (const suffix of ['', '/location?field=destination', '/time', '/confirm']) {
    test(`비로그인 사용자는 새 등록 경로 ${suffix || '/'}에서 로그인 안내를 본다`, async ({
      page,
    }) => {
      await mockSession(page, false);
      await page.goto(`${TAXI_POT_CREATE_PATH}${suffix}`);

      await expect(page.getByRole('dialog', { name: '로그인이 필요해요' })).toBeVisible();
      await page.getByRole('button', { name: '취소', exact: true }).click();
      await expect(page).toHaveURL(/\/$/);
    });
  }

  test('등록 화면에서 출발지와 도착지 검색으로 이동하고 새 등록 경로로 돌아온다', async ({
    page,
  }) => {
    await mockSession(page, true);
    await page.goto(TAXI_POT_CREATE_PATH);

    for (const [label, field] of [
      ['출발지', 'departure'],
      ['도착지', 'destination'],
    ] as const) {
      await page.getByRole('button', { name: label, exact: true }).click();
      await expect(page).toHaveURL(`${TAXI_POT_CREATE_PATH}/location?field=${field}`);
      await expect(page.getByRole('textbox', { name: label, exact: true })).toBeFocused();
      await page.getByRole('link', { name: '뒤로가기' }).click();
      await expect(page).toHaveURL(TAXI_POT_CREATE_PATH);
    }
    await expect(page.getByRole('dialog', { name: '로그인이 필요해요' })).toBeHidden();
  });

  test('검색 결과를 누르면 선택한 장소의 좌표로 조정 지도를 생성한다', async ({ page }) => {
    await mockSession(page, true);
    await page.addInitScript(() => {
      class FakeLatLng {
        constructor(
          private latitude: number,
          private longitude: number,
        ) {}

        getLat() {
          return this.latitude;
        }

        getLng() {
          return this.longitude;
        }
      }

      class FakeMap {
        private center: FakeLatLng;

        constructor(_container: HTMLElement, options: { center: FakeLatLng }) {
          this.center = options.center;
          document.documentElement.dataset.initialMapCenter = `${this.center.getLat()},${this.center.getLng()}`;
        }

        getCenter() {
          return this.center;
        }

        getBounds() {
          return { getSouthWest: () => this.center, getNorthEast: () => this.center };
        }

        getLevel() {
          return 5;
        }

        relayout() {}

        setCenter(center: FakeLatLng) {
          this.center = center;
        }
      }

      Object.assign(window, {
        kakao: {
          maps: {
            LatLng: FakeLatLng,
            Map: FakeMap,
            event: { addListener() {}, removeListener() {} },
            load: (callback: () => void) => callback(),
            services: {
              Places: class {
                keywordSearch(
                  _keyword: string,
                  callback: (results: unknown[], status: string) => void,
                ) {
                  callback(
                    [
                      {
                        id: 'pangyo-station',
                        place_name: '판교역',
                        address_name: '경기 성남시 분당구 백현동',
                        road_address_name: '경기 성남시 분당구 판교역로',
                        x: '127.11123456',
                        y: '37.39451234',
                      },
                    ],
                    'OK',
                  );
                }
              },
              Geocoder: class {
                coord2Address(
                  _x: number,
                  _y: number,
                  callback: (results: unknown[], status: string) => void,
                ) {
                  callback([], 'ZERO_RESULT');
                }
              },
              Status: { OK: 'OK', ZERO_RESULT: 'ZERO_RESULT' },
            },
          },
        },
      });
    });

    await page.goto(`${TAXI_POT_CREATE_PATH}/location?field=departure`);
    await page.getByRole('textbox', { name: '출발지' }).fill('판교역');
    await page.getByRole('button', { name: /판교역.*상세 위치 조정/ }).click();

    await expect(page).toHaveURL(`${TAXI_POT_CREATE_PATH}/location/adjust?field=departure`);
    await expect(page.locator('html')).toHaveAttribute(
      'data-initial-map-center',
      '37.39451234,127.11123456',
    );
  });

  test('상세 위치가 없는 직접 접근은 선택 필드를 유지해 새 검색 경로로 돌아온다', async ({
    page,
  }) => {
    await mockSession(page, true);
    await page.goto(`${TAXI_POT_CREATE_PATH}/location/adjust?field=destination`);

    await expect(page).toHaveURL(`${TAXI_POT_CREATE_PATH}/location?field=destination`);
    await expect(page.getByRole('textbox', { name: '도착지', exact: true })).toBeFocused();
  });
});
