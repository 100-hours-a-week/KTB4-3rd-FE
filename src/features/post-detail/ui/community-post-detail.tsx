'use client';

import { useEffect, useRef } from 'react';

import {
  CommentList,
  CommentSummary,
  PostDetailInfo,
  type CommunityPostDetail,
} from '@/entities/post';
import { CommentComposer } from '@/features/post-comment';
import { cn } from '@/shared/lib/cn';
import { Snackbar } from '@/shared/ui/snackbar';
import { Text } from '@/shared/ui/text';

export type CommunityPostCommentFeedback = {
  description: string;
  type: 'critical' | 'positive';
};

export type CommunityPostDetailProps = {
  className?: string;
  commentFeedback?: CommunityPostCommentFeedback | null;
  commentsError?: boolean;
  commentsLoading?: boolean;
  hasMoreComments?: boolean;
  isCommentSubmitting?: boolean;
  isLoadingMoreComments?: boolean;
  layout?: 'modal' | 'page';
  onCommentFeedbackDismiss?: () => void;
  onCommentSubmit?: (content: string) => void;
  onLoadMoreComments?: () => void;
  post: CommunityPostDetail;
};

export function CommunityPostDetail({
  className,
  commentFeedback,
  commentsError = false,
  commentsLoading = false,
  hasMoreComments = false,
  isCommentSubmitting = false,
  isLoadingMoreComments = false,
  layout = 'modal',
  onCommentFeedbackDismiss,
  onCommentSubmit,
  onLoadMoreComments,
  post,
}: CommunityPostDetailProps) {
  const isPageLayout = layout === 'page';
  const loadMoreCommentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = loadMoreCommentsRef.current;

    if (
      !target ||
      commentsError ||
      !hasMoreComments ||
      !onLoadMoreComments ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isLoadingMoreComments) {
          onLoadMoreComments();
        }
      },
      { rootMargin: '0px 0px 160px 0px' },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [commentsError, hasMoreComments, isLoadingMoreComments, onLoadMoreComments]);

  return (
    <article
      className={cn(
        'flex flex-col',
        isPageLayout ? 'min-h-[calc(100dvh-56px)]' : 'h-full min-h-0 min-w-0 overflow-hidden',
        className,
      )}
    >
      <div
        className={cn(!isPageLayout && 'min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto')}
        data-testid={isPageLayout ? undefined : 'community-post-detail-scroll'}
      >
        <PostDetailInfo
          description={post.description}
          layout={layout}
          title={post.title}
          type={post.type}
        />

        {isPageLayout ? (
          <>
            <div className="mx-auto mt-[14px] flex w-[312px] justify-end" data-clarity-mask="true">
              <Text color="fg.neutral" variant="t6Bold">
                {post.author.nickname}
              </Text>
            </div>
            <div className="mt-[21px] px-10">
              <CommentSummary count={post.comment_count} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between px-6 pb-5" data-clarity-mask="true">
            <CommentSummary count={post.comment_count} />
            <Text color="fg.neutral" variant="t4Bold">
              {post.author.nickname}
            </Text>
          </div>
        )}

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
        {post.comments.length > 0 ? (
          <CommentList
            className={isPageLayout ? 'mt-[38px]' : undefined}
            layout={layout}
            comments={post.comments}
          />
        ) : null}
        {hasMoreComments && onLoadMoreComments ? (
          <div
            aria-live="polite"
            className="flex min-h-8 items-center justify-center px-6 py-2"
            ref={loadMoreCommentsRef}
          >
            {isLoadingMoreComments ? (
              <Text color="fg.neutralSubtle" variant="t4Regular">
                댓글을 불러오는 중이에요.
              </Text>
            ) : null}
          </div>
        ) : null}
        {commentFeedback ? (
          <Snackbar
            className="mx-6 mb-2 !w-auto !max-w-none"
            description={commentFeedback.description}
            onOpenChange={(open) => {
              if (!open) {
                onCommentFeedbackDismiss?.();
              }
            }}
            open
            timeout={commentFeedback.type === 'positive' ? 3000 : undefined}
            type={commentFeedback.type}
          />
        ) : null}
      </div>
      <CommentComposer
        className={cn(
          'mt-auto shrink-0',
          isPageLayout
            ? 'sticky bottom-0 z-10 bg-white !px-[27px] !py-1'
            : 'bg-[var(--color-bg-layer-default)]',
        )}
        disabled={isCommentSubmitting}
        onSubmit={onCommentSubmit}
      />
    </article>
  );
}
