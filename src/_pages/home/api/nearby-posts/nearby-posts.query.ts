import { queryOptions } from '@tanstack/react-query';

import { getNearbyPosts } from './get-nearby-posts';
import type { NearbyPostsQuery } from './nearby-posts.types';

export const nearbyPostsQueries = {
  all: () => ['nearby-posts'] as const,
  list: (query: NearbyPostsQuery | null) =>
    queryOptions({
      queryKey: [...nearbyPostsQueries.all(), 'list', query] as const,
      enabled: query !== null,
      queryFn: () => {
        if (!query) {
          throw new Error('주변 게시글 조회 조건이 없어 게시글을 조회할 수 없습니다.');
        }

        return getNearbyPosts(query);
      },
    }),
};
