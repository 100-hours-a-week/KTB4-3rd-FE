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
      <CommentComposer disabled={isCommentSubmitting} onSubmit={onCommentSubmit} />
    </article>
  );
}
