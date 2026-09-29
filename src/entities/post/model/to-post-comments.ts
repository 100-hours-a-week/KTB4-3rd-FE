import type { CommunityPostComment } from './community-comment';
import type { PostComment } from './post-detail';

const UNKNOWN_COMMENT_AUTHOR = '알 수 없는 사용자';

/**
 * API returns comments from newest to oldest. Post detail UI displays them in
 * chronological order, so reverse the flattened pages before mapping them.
 */
export function toPostComments(comments: readonly CommunityPostComment[]): PostComment[] {
  return [...comments].reverse().map((comment) => ({
    id: comment.id,
    author: {
      nickname: comment.author?.nickname ?? UNKNOWN_COMMENT_AUTHOR,
      profile_image_url: comment.author?.profile_image_url ?? null,
    },
    content: comment.content,
  }));
}
