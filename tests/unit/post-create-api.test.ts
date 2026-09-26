import { describe, expect, it } from 'vitest';

import { createCompanionPost, createCommunityPost } from '@/features/post-create';

const companionPayload = {
  origin_name: '판교역',
  origin_lat: 37.3945,
  origin_lng: 127.1112,
  dest_name: '강남역',
  dest_lat: 37.4979,
  dest_lng: 127.0276,
  departure_at: '2026-09-05T08:30:00.000Z',
  transport_type: 'TAXI' as const,
  recruit_count: 3,
  content: '택시 같이 타실 분 구합니다!',
};

const communityPayload = {
  title: '판교역 근처 카페 추천',
  content: '조용히 작업하기 좋은 카페가 있을까요?',
  lat: 37.3945,
  lng: 127.1112,
};

describe('post create API', () => {
  it('동행모집 게시글을 인증 토큰과 함께 등록한다', async () => {
    const response = await createCompanionPost('mock-access-token', companionPayload);

    expect(response).toEqual({
      message: '동행모집 게시글이 등록되었습니다',
      data: { id: 101 },
    });
  });

  it('커뮤니티 게시글을 인증 토큰과 함께 등록한다', async () => {
    const response = await createCommunityPost('mock-access-token', communityPayload);

    expect(response).toEqual({
      message: '커뮤니티 게시글이 등록되었습니다',
      data: { id: 102 },
    });
  });

  it('인증 토큰이 유효하지 않으면 ApiError로 변환한다', async () => {
    await expect(createCommunityPost('invalid-token', communityPayload)).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
      field: null,
    });
  });

  it('게시글 등록 실패 응답을 ApiError로 변환한다', async () => {
    await expect(
      createCompanionPost('mock-access-token', {
        ...companionPayload,
        origin_name: '이미 등록된 출발지',
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'POST_CREATE_FAILED',
      message: '게시글을 등록할 수 없습니다',
    });
  });
});
