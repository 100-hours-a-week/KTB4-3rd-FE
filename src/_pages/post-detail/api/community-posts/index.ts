export type {
  CommunityPostDetailAuthor,
  CommunityPostDetailData,
  CommunityPostDetailResponse,
} from './community-posts.types';
export { getCommunityPostComments } from '@/entities/post';
export { getCommunityPostDetail } from './get-community-post-detail';
export { communityPostQueries } from './community-posts.query';
export { useCommunityPostCommentsQuery } from './use-community-post-comments-query';
export { useCommunityPostDetailQuery } from './use-community-post-detail-query';
