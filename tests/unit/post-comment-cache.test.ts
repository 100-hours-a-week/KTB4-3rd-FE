import { QueryClient, type InfiniteData } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import type {
  CommunityPostComment,
  CommunityPostCommentsResponse,
  CreatedCommunityPostComment,
} from '@/entities/post';
import { insertCreatedCommunityPostComment } from '@/features/post-comment';

describe('insertCreatedCommunityPostComment', () => {
  it('등록 응답을 댓글 첫 페이지에 즉시 반영한다', () => {
    const queryClient = new QueryClient();
    const queryKey = ['community-posts', 'comments', 88] as const;
    const previousComment: CommunityPostComment = {
      author: { nickname: '기존 사용자', profile_image_url: null },
      content: '기존 댓글입니다',
      created_at: '2026-09-03T10:00:00.000Z',
      id: 1,
    };
    const createdComment: CreatedCommunityPostComment = {
      comment_count: 2,
      content: '새 댓글입니다',
      created_at: '2026-09-03T11:00:00.000Z',
      id: 2,
      nickname: '새 사용자',
    };
    const previousData: InfiniteData<CommunityPostCommentsResponse> = {
      pageParams: [null],
      pages: [
        {
          data: { items: [previousComment], next_cursor: 'next' },
          message: '조회에 성공했습니다',
        },
      ],
    };

    queryClient.setQueryData(queryKey, previousData);
    insertCreatedCommunityPostComment(queryClient, queryKey, createdComment);

    expect(queryClient.getQueryData<InfiniteData<CommunityPostCommentsResponse>>(queryKey)).toEqual(
      {
        pageParams: [null],
        pages: [
          {
            data: {
              items: [
                {
                  author: { nickname: '새 사용자', profile_image_url: null },
                  content: '새 댓글입니다',
                  created_at: '2026-09-03T11:00:00.000Z',
                  id: 2,
                },
                previousComment,
              ],
              next_cursor: 'next',
            },
            message: '조회에 성공했습니다',
          },
        ],
      },
    );
  });

  it('이미 캐시에 있는 댓글은 중복으로 삽입하지 않는다', () => {
    const queryClient = new QueryClient();
    const queryKey = ['community-posts', 'comments', 88] as const;
    const comment: CommunityPostComment = {
      author: { nickname: '사용자', profile_image_url: null },
      content: '댓글입니다',
      created_at: '2026-09-03T11:00:00.000Z',
      id: 2,
    };
    const previousData: InfiniteData<CommunityPostCommentsResponse> = {
      pageParams: [null],
      pages: [
        {
          data: { items: [comment], next_cursor: null },
          message: '조회에 성공했습니다',
        },
      ],
    };

    queryClient.setQueryData(queryKey, previousData);
    insertCreatedCommunityPostComment(queryClient, queryKey, {
      comment_count: 1,
      content: comment.content,
      created_at: comment.created_at,
      id: comment.id,
      nickname: comment.author.nickname,
    });

    expect(queryClient.getQueryData(queryKey)).toBe(previousData);
  });
});
