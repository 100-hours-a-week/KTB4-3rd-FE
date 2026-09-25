import { useQuery } from '@tanstack/react-query';

import { communityPostQueries } from './community-posts.query';

export function useCommunityPostDetailQuery(postId: number | null) {
  return useQuery(communityPostQueries.detail(postId));
}
