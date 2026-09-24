import { describe, expect, it } from 'vitest';

type ApiResponse<T> = {
  message: string;
  data: T;
};

type ApiErrorResponse = {
  message: string;
  error: {
    code: string;
    field: string | null;
  };
};

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

describe('홈 화면 MSW mock API', () => {
  it('현재 지도 범위에 포함된 지도 핀을 반환한다', async () => {
    const response = await fetch(
      'http://localhost:8080/map-pins?sw_lat=37.3&sw_lng=127&ne_lat=37.6&ne_lng=127.2',
    );
    const body = await readJson<
      ApiResponse<{
        items: { type: string; id: number; lat: number; lng: number }[];
        limit: number;
        limit_exceeded: boolean;
      }>
    >(response);

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      items: [
        { type: 'COMPANION', id: 10, lat: 37.3945, lng: 127.1112 },
        { type: 'COMMUNITY', id: 88, lat: 37.5123, lng: 127.041 },
      ],
      limit: 500,
      limit_exceeded: false,
    });
  });

  it('지도 범위가 올바르지 않으면 validation error를 반환한다', async () => {
    const response = await fetch(
      'http://localhost:8080/map-pins?sw_lat=37.6&sw_lng=127&ne_lat=37.3&ne_lng=127.2',
    );
    const body = await readJson<ApiErrorResponse>(response);

    expect(response.status).toBe(400);
    expect(body.error).toEqual({ code: 'VALIDATION_ERROR', field: null });
  });

  it('주변 게시글과 다음 cursor를 반환한다', async () => {
    const response = await fetch(
      'http://localhost:8080/nearby-posts?lat=37.3945&lng=127.1112&sw_lat=37.3&sw_lng=127&ne_lat=37.6&ne_lng=127.2',
    );
    const body = await readJson<
      ApiResponse<{
        items: { type: string; id: number }[];
        next_cursor: string | null;
      }>
    >(response);

    expect(response.status).toBe(200);
    expect(body.data.items.map(({ type, id }) => ({ type, id }))).toEqual([
      { type: 'COMPANION', id: 10 },
      { type: 'COMMUNITY', id: 88 },
    ]);
    expect(body.data.next_cursor).toBe('v1.eyJsYXN0X2Rpc3RhbmNlX20iOjU0MH0');
  });

  it('잘못된 cursor를 거부한다', async () => {
    const response = await fetch(
      'http://localhost:8080/nearby-posts?lat=37.3945&lng=127.1112&sw_lat=37.3&sw_lng=127&ne_lat=37.6&ne_lng=127.2&cursor=invalid',
    );
    const body = await readJson<ApiErrorResponse>(response);

    expect(response.status).toBe(400);
    expect(body.error).toEqual({ code: 'INVALID_CURSOR', field: null });
  });

  it('동행모집 게시글 상세를 반환한다', async () => {
    const response = await fetch('http://localhost:8080/companion-posts/10');
    const body = await readJson<
      ApiResponse<{
        id: number;
        title: string;
        current_count: number;
        capacity: number;
        joined: boolean;
      }>
    >(response);

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      id: 10,
      title: '판교역 → 강남역',
      current_count: 2,
      capacity: 4,
      joined: true,
    });
  });

  it('취소된 동행모집 게시글은 410으로 반환한다', async () => {
    const response = await fetch('http://localhost:8080/companion-posts/11');
    const body = await readJson<ApiErrorResponse>(response);

    expect(response.status).toBe(410);
    expect(body.error).toEqual({ code: 'COMPANION_POST_CLOSED', field: null });
  });

  it('커뮤니티 게시글 상세를 반환한다', async () => {
    const response = await fetch('http://localhost:8080/community-posts/88');
    const body = await readJson<
      ApiResponse<{
        id: number;
        title: string;
        comment_count: number;
      }>
    >(response);

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      id: 88,
      title: '판교역 근처 카페 추천',
      comment_count: 3,
    });
  });

  it('삭제된 커뮤니티 게시글은 410으로 반환한다', async () => {
    const response = await fetch('http://localhost:8080/community-posts/89');
    const body = await readJson<ApiErrorResponse>(response);

    expect(response.status).toBe(410);
    expect(body.error).toEqual({ code: 'GONE', field: null });
  });
});
