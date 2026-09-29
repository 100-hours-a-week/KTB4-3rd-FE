import { describe, expect, it } from 'vitest';

import { getCompanionPostDetail } from '@/_pages/post-detail/api/companion-posts';

describe('companion post detail API', () => {
  it('동행모집 게시글 상세를 조회한다', async () => {
    const response = await getCompanionPostDetail(10);

    expect(response.data).toEqual({
      id: 10,
      title: '판교역 → 강남역',
      content: '택시 같이 타실 분 구해요',
      transport_type: 'TAXI',
      origin_name: '판교역',
      dest_name: '강남역',
      departure_at: '2026-09-05T08:30:00.000Z',
      is_expired: false,
      current_count: 2,
      capacity: 4,
      is_full: false,
      author: { nickname: '우림' },
      participants: [
        { nickname: '우림', profile_image_url: null },
        { nickname: '루디', profile_image_url: 'https://example.com/profile/rudy.png' },
      ],
      chat_room_id: 501,
      joined: true,
    });
  });

  it.each([
    [11, 410, 'COMPANION_POST_CLOSED'],
    [12, 404, 'POST_NOT_FOUND'],
    [999, 500, 'INTERNAL_SERVER_ERROR'],
  ])('API 오류 응답을 상태와 코드로 변환한다', async (companionId, status, code) => {
    await expect(getCompanionPostDetail(companionId)).rejects.toMatchObject({
      status,
      code,
    });
  });
});
