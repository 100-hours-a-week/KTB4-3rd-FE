import { useInfiniteQuery } from '@tanstack/react-query';

import { communityPostQueries } from './community-posts.query';

export function useCommunityPostCommentsQuery(postId: number | null) {
  return useInfiniteQuery(communityPostQueries.comments(postId));
}
