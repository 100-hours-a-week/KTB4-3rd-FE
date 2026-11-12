import { describe, expect, it } from 'vitest';

import {
  toCompanionPostDetail,
  toCommunityPostDetail,
  type CompanionPostDetailData,
  type CommunityPostDetailData,
} from '@/entities/post';

describe('post detail adapters', () => {
  it('상세 API 응답을 동행 게시글 도메인 모델로 변환한다', () => {
    const data: CompanionPostDetailData = {
      author: { nickname: '새 작성자' },
      capacity: 4,
      chat_room_id: null,
      content: '판교역에서 같이 출발해요.',
      departure_at: '2026-10-22T09:00:00.000Z',
      dest_name: '강남역',
      current_count: 2,
      id: 10,
      is_expired: false,
      is_full: false,
      joined: false,
      origin_name: '판교역',
      participants: [{ nickname: '참여자', profile_image_url: null }],
      title: '택시 같이 타실 분',
      transport_type: 'TAXI',
    };

    expect(toCompanionPostDetail(data)).toEqual({
      type: 'COMPANION',
      id: 10,
      title: '택시 같이 타실 분',
      content: '판교역에서 같이 출발해요.',
      author: { nickname: '새 작성자', profile_image_url: null },
      transport_type: 'TAXI',
      distance_m: 0,
      current_count: 2,
      capacity: 4,
      departure_at: '2026-10-22T09:00:00.000Z',
      origin_name: '판교역',
      dest_name: '강남역',
      is_expired: false,
      participants: [{ id: 1, nickname: '참여자', profile_image_url: null }],
    });
  });

  it('상세 API 응답과 목록 요약을 합쳐 커뮤니티 게시글을 만든다', () => {
    const data: CommunityPostDetailData = {
      author: { nickname: '상세 작성자' },
      comment_count: 2,
      content: '새로운 내용이에요.',
      created_at: '2026-10-22T09:00:00.000Z',
      id: 88,
      title: '커뮤니티 글',
    };
    const summary = {
      author: { nickname: '목록 작성자', profile_image_url: 'profile.jpg' },
      comment_count: 1,
      created_at: '2026-10-21T09:00:00.000Z',
      distance_m: 320,
      id: 88,
      title: '목록 제목',
      type: 'COMMUNITY' as const,
    };
    const comments = [
      {
        author: { nickname: '댓글 작성자', profile_image_url: null },
        content: '댓글 내용',
        id: 1,
      },
    ];

    expect(toCommunityPostDetail(data, comments, summary)).toEqual({
      ...summary,
      id: 88,
      title: '커뮤니티 글',
      content: '새로운 내용이에요.',
      author: { nickname: '상세 작성자', profile_image_url: 'profile.jpg' },
      comment_count: 2,
      created_at: '2026-10-22T09:00:00.000Z',
      comments,
    });
  });
});
