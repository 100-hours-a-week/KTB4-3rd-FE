import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import {
  getCarpoolDetail,
  getCarpoolPins,
  getNearbyCarpools,
  type CarpoolViewport,
  type NearbyCarpoolsQuery,
} from '@/shared/api/carpool';
import { ApiError, apiFetch, registerAuthRefreshHandler } from '@/shared/api/client';
import { server } from '@/shared/api/mocks/server';

const viewport: CarpoolViewport = { sw_lat: 37.55, sw_lng: 126.96, ne_lat: 37.57, ne_lng: 126.99 };
const query: NearbyCarpoolsQuery = { ...viewport, lat: 37.5547, lng: 126.9707 };

describe('카풀 공개 조회 API', () => {
  it('상세 조회는 공개 접근을 허용하고 비로그인 응답의 my_request 생략을 보존한다', async () => {
    const response = await getCarpoolDetail(51);

    expect(response.data).toMatchObject({
      id: 51,
      status: 'RECRUITING',
      host: { id: 7, name: '김우림' },
      origin_name: '서울역',
      dest_name: '판교역',
      departure_at: '2026-10-10T09:40:00',
      car_model: '아반떼',
      current_count: 2,
      capacity: 4,
      is_full: false,
      participants: [{ id: 7, name: '김우림', profile_image_url: null }],
    });
    expect('my_request' in response.data).toBe(false);
  });

  it('로그인 상세 조회에는 bearer token을 전달하고 내 요청을 포함한다', async () => {
    let received: Request | undefined;
    server.use(
      http.get('*/carpools/51', ({ request }) => {
        received = request;
        return HttpResponse.json({
          message: '조회',
          data: {
            id: 51,
            status: 'RECRUITING',
            host: { id: 7, name: '김우림', profile_image_url: null },
            origin_name: '서울역',
            dest_name: '판교역',
            departure_at: '2026-10-10T09:40:00',
            car_model: '아반떼',
            current_count: 2,
            capacity: 4,
            is_full: false,
            participants: [],
            my_request: { id: 108, status: 'PENDING' },
          },
        });
      }),
    );

    const response = await getCarpoolDetail(51, 'viewer-token');

    expect(received?.headers.get('authorization')).toBe('Bearer viewer-token');
    expect(response.data.my_request).toEqual({ id: 108, status: 'PENDING' });
  });

  it('존재하지 않는 상세의 404와 CARPOOL_NOT_FOUND를 전달한다', async () => {
    await expect(getCarpoolDetail(999)).rejects.toMatchObject({
      status: 404,
      code: 'CARPOOL_NOT_FOUND',
    });
  });

  it('핀 요청에 반올림 없는 지도 좌표만 전달하고 인증 헤더를 넣지 않는다', async () => {
    const coords = { sw_lat: -37.1234567, sw_lng: -127.2345678, ne_lat: 0, ne_lng: 0.000001 };
    let received: Request | undefined;
    server.use(
      http.get('*/carpool-pins', ({ request }) => {
        received = request;
        return HttpResponse.json({
          message: '조회',
          data: { items: [], limit: 500, limit_exceeded: false },
        });
      }),
    );
    await getCarpoolPins(coords);
    if (!received) {
      throw new Error('요청이 없습니다.');
    }
    expect(Object.fromEntries(new URL(received.url).searchParams)).toEqual(
      Object.fromEntries(Object.entries(coords).map(([key, value]) => [key, String(value)])),
    );
    expect(received.headers.get('authorization')).toBeNull();
  });
  it('목록 첫 페이지에는 거리 기준과 영역을 전달하고 cursor는 생략한다', async () => {
    let received: Request | undefined;
    server.use(
      http.get('*/carpools', ({ request }) => {
        received = request;
        return HttpResponse.json({ message: '조회', data: { items: [], next_cursor: null } });
      }),
    );
    await getNearbyCarpools(query);
    if (!received) {
      throw new Error('요청이 없습니다.');
    }
    expect(Object.fromEntries(new URL(received.url).searchParams)).toEqual(
      Object.fromEntries(Object.entries(query).map(([key, value]) => [key, String(value)])),
    );
    expect(received.headers.get('authorization')).toBeNull();
  });
  it('커서의 특수 문자를 안전하게 직렬화하고 원문을 보존한다', async () => {
    const cursor = 'v1.a+b/c=?&공백 값';
    server.use(
      http.get('*/carpools', ({ request }) => {
        expect(new URL(request.url).searchParams.get('cursor')).toBe(cursor);
        return HttpResponse.json({ message: '조회', data: { items: [], next_cursor: null } });
      }),
    );
    expect((await getNearbyCarpools({ ...query, cursor })).data.next_cursor).toBeNull();
  });
  it('핀 개수 초과 성공 응답을 오류로 바꾸지 않는다', async () => {
    const response = {
      message: '지도를 확대해주세요',
      data: { items: [], limit: 500, limit_exceeded: true },
    };
    server.use(http.get('*/carpool-pins', () => HttpResponse.json(response)));
    expect(await getCarpoolPins(viewport)).toEqual(response);
  });
  it('날짜·이름·인원·full/expired 등 응답을 변환하지 않는다', async () => {
    const item = {
      id: 1,
      host: { name: '실명', profile_image_url: null },
      origin_name: '서울역',
      dest_name: '판교역',
      departure_at: '2026-10-10T18:40:00',
      distance_m: 123.4,
      current_count: 4,
      capacity: 4,
      is_full: true,
      is_expired: true,
    };
    server.use(
      http.get('*/carpools', () =>
        HttpResponse.json({ message: '조회', data: { items: [item], next_cursor: '다음' } }),
      ),
    );
    expect((await getNearbyCarpools(query)).data).toEqual({ items: [item], next_cursor: '다음' });
  });
  it.each([400, 401, 403, 404, 409, 422, 500])(
    'HTTP %s를 상태와 코드·메시지가 있는 ApiError로 전달한다',
    async (status) => {
      server.use(
        http.get('*/carpools', () =>
          HttpResponse.json(
            { message: '조회 실패', error: { code: 'READ_ERROR', field: null } },
            { status },
          ),
        ),
      );
      await expect(getNearbyCarpools(query)).rejects.toMatchObject({
        name: 'ApiError',
        message: '조회 실패',
        status,
        code: 'READ_ERROR',
        field: null,
      });
    },
  );
  it('422 오류의 여러 검증 사유를 그대로 전달한다', async () => {
    const details = [
      { field: 'sw_lat', reason: 'REQUIRED' },
      { field: 'ne_lng', reason: 'OUT_OF_RANGE' },
    ];
    server.use(
      http.get('*/carpool-pins', () =>
        HttpResponse.json(
          { message: '좌표 확인', error: { code: 'VALIDATION_ERROR', field: 'sw_lat', details } },
          { status: 422 },
        ),
      ),
    );
    await expect(getCarpoolPins(viewport)).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      field: 'sw_lat',
      details,
    });
    expect(new ApiError(500).details).toBeUndefined();
  });
  it.each(['pins', 'nearby'])('공개 %s 조회의 401은 토큰 갱신 없이 전달한다', async (kind) => {
    const refresh = vi.fn<() => Promise<string>>(async () => 'refreshed-token');
    registerAuthRefreshHandler(refresh);
    server.use(
      http.get(kind === 'pins' ? '*/carpool-pins' : '*/carpools', () =>
        HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 }),
      ),
    );
    await expect(
      kind === 'pins' ? getCarpoolPins(viewport) : getNearbyCarpools(query),
    ).rejects.toMatchObject({ status: 401 });
    expect(refresh).not.toHaveBeenCalled();
  });
  it.each(['pins', 'nearby'])('취소된 %s 요청의 AbortSignal을 fetch까지 전달한다', async (kind) => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      kind === 'pins'
        ? getCarpoolPins(viewport, controller.signal)
        : getNearbyCarpools(query, controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('MSW 핀은 요청 영역 밖의 아이템을 제외한다', async () => {
    expect((await getCarpoolPins(viewport)).data.items.map((pin) => pin.id)).toEqual([51, 77]);
    expect(
      (await getCarpoolPins({ sw_lat: 0, sw_lng: 0, ne_lat: 0.5, ne_lng: 0.5 })).data.items,
    ).toEqual([]);
  });
  it('MSW 목록은 위치별 가까운 순과 커서 페이지를 제공하고 full/expired를 유지한다', async () => {
    const first = await getNearbyCarpools(query);
    expect(first.data.items.map((item) => item.id)).toEqual([51, 77]);
    expect(first.data.items[1].is_full).toBe(true);
    if (first.data.next_cursor === null) {
      throw new Error('다음 커서가 없습니다.');
    }
    const last = await getNearbyCarpools({ ...query, cursor: first.data.next_cursor });
    expect(last.data.items[0].is_expired).toBe(true);
    expect(last.data.next_cursor).toBeNull();
    const shifted = await getNearbyCarpools({ ...query, lat: 37.556, lng: 126.973 });
    expect(shifted.data.items[0].id).toBe(77);
    expect(shifted.data.items[0].distance_m).toBe(0);
  });
  it('MSW 빈 영역에서는 다음 커서 없이 빈 목록을 반환한다', async () => {
    expect(
      (await getNearbyCarpools({ lat: 0, lng: 0, sw_lat: 0, sw_lng: 0, ne_lat: 0.5, ne_lng: 0.5 }))
        .data,
    ).toEqual({ items: [], next_cursor: null });
  });
  it('다른 조회 조건의 MSW 커서는 INVALID_CURSOR로 거부한다', async () => {
    const first = await getNearbyCarpools(query);
    if (first.data.next_cursor === null) {
      throw new Error('다음 커서가 없습니다.');
    }
    await expect(
      getNearbyCarpools({ ...query, lat: 37.556, cursor: first.data.next_cursor }),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_CURSOR' });
  });
  it('각 축 1도인 영역은 허용한다', async () => {
    expect((await getCarpoolPins({ sw_lat: 0, sw_lng: 0, ne_lat: 1, ne_lng: 1 })).data.limit).toBe(
      500,
    );
  });
  it('좌표 누락의 검증 상세를 보존한다', async () => {
    await expect(
      apiFetch('/carpool-pins?sw_lat=37.55&sw_lng=126.96&ne_lat=37.57', { skipAuthRefresh: true }),
    ).rejects.toMatchObject({
      status: 422,
      details: [{ field: 'ne_lng', reason: 'REQUIRED' }],
    });
  });
  it.each([
    [{ ...viewport, sw_lat: NaN }, 422, 'VALIDATION_ERROR'],
    [{ ...viewport, sw_lat: 91 }, 422, 'VALIDATION_ERROR'],
    [{ ...viewport, ne_lng: 181 }, 422, 'VALIDATION_ERROR'],
    [{ ...viewport, sw_lat: viewport.ne_lat }, 400, 'VIEWPORT_OUT_OF_RANGE'],
    [{ ...viewport, ne_lat: viewport.sw_lat + 1.1 }, 400, 'VIEWPORT_TOO_LARGE'],
    [{ ...viewport, ne_lng: viewport.sw_lng + 1.1 }, 400, 'VIEWPORT_TOO_LARGE'],
  ] as const)('MSW가 잘못된 영역을 거부한다: %j', async (coords, status, code) => {
    await expect(getCarpoolPins(coords)).rejects.toMatchObject({ status, code });
  });
});
