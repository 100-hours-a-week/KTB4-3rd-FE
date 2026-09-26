import {
  CommentList,
  CommentSummary,
  PostDetailInfo,
  type CommunityPostDetail,
} from '@/entities/post';
import { CommentComposer } from '@/features/post-comment';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';

export type CommunityPostDetailProps = {
  className?: string;
  commentsError?: boolean;
  commentsLoading?: boolean;
  hasMoreComments?: boolean;
  isCommentSubmitting?: boolean;
  isLoadingMoreComments?: boolean;
  onCommentSubmit?: (content: string) => void;
  onLoadMoreComments?: () => void;
  post: CommunityPostDetail;
};

export function CommunityPostDetail({
  className,
  commentsError = false,
  commentsLoading = false,
  hasMoreComments = false,
  isCommentSubmitting = false,
  isLoadingMoreComments = false,
  onCommentSubmit,
  onLoadMoreComments,
  post,
}: CommunityPostDetailProps) {
  return (
    <article className={cn('flex flex-col', className)}>
      <PostDetailInfo description={post.description} title={post.title} type={post.type} />

      <div className="flex items-center justify-between px-6 pb-5">
        <CommentSummary count={post.comment_count} />
        <Text color="fg.neutral" variant="t4Bold">
          {post.author.nickname}
        </Text>
      </div>

      {commentsLoading && post.comments.length === 0 ? (
        <Text className="block px-6 py-5" color="fg.neutralSubtle" variant="t4Regular">
          댓글을 불러오는 중이에요.
        </Text>
      ) : null}
      {commentsError ? (
        <Text className="block px-6 py-5" color="fg.critical" variant="t4Regular">
          댓글을 불러오지 못했어요.
        </Text>
      ) : null}
      {!commentsLoading && !commentsError && post.comments.length === 0 ? (
        <Text className="block px-6 py-5" color="fg.neutralSubtle" variant="t4Regular">
          아직 댓글이 없어요.
        </Text>
      ) : null}
      {post.comments.length > 0 ? <CommentList comments={post.comments} /> : null}
      {hasMoreComments && onLoadMoreComments ? (
        <button
          aria-busy={isLoadingMoreComments}
          className="mx-auto my-2 rounded-lg px-4 py-2 text-[length:var(--font-size-t4)] text-[var(--color-fg-neutral)] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoadingMoreComments}
          onClick={onLoadMoreComments}
          type="button"
        >
          {isLoadingMoreComments ? '댓글을 불러오는 중이에요.' : '댓글 더보기'}
        </button>
      ) : null}
      <CommentComposer disabled={isCommentSubmitting} onSubmit={onCommentSubmit} />
    </article>
  );
}
