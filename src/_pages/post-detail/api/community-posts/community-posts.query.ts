import { queryOptions } from '@tanstack/react-query';

import { getCommunityPostDetail } from './get-community-post-detail';

export const communityPostQueries = {
  all: () => ['community-posts'] as const,
  detail: (postId: number | null) =>
    queryOptions({
      queryKey: [...communityPostQueries.all(), 'detail', postId] as const,
      enabled: postId !== null,
      queryFn: () => {
        if (postId === null) {
          throw new Error('커뮤니티 게시글 ID가 없어 상세 내용을 조회할 수 없습니다.');
        }

        return getCommunityPostDetail(postId);
      },
    }),
};
