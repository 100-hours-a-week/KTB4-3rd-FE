'use client';

import { type InfiniteData, type UseInfiniteQueryResult } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { toPostComments, type CommunityPostCommentsResponse } from '@/entities/post';

import { useCreateCommunityPostCommentMutation } from './use-create-community-post-comment';

type CommunityPostCommentsQuery = Pick<
  UseInfiniteQueryResult<InfiniteData<CommunityPostCommentsResponse>, Error>,
  | 'data'
  | 'fetchNextPage'
  | 'hasNextPage'
  | 'isError'
  | 'isFetchingNextPage'
  | 'isPending'
  | 'refetch'
>;

type RequireAuth = (action: () => void) => void;

type CommentFeedback = {
  description: string;
  type: 'critical' | 'positive';
};

export type CommunityPostCommentWorkflowOptions = {
  commentsQuery: CommunityPostCommentsQuery;
  onCommentCreated?: (postId: number) => void;
  postId: number | null;
  requireAuth: RequireAuth;
};

export function useCommunityPostCommentWorkflow({
  commentsQuery,
  onCommentCreated,
  postId,
  requireAuth,
}: CommunityPostCommentWorkflowOptions) {
  const createCommentMutation = useCreateCommunityPostCommentMutation();
  const [commentFeedback, setCommentFeedback] = useState<CommentFeedback | null>(null);
  const [commentIdToScroll, setCommentIdToScroll] = useState<number | null>(null);
  const { data, fetchNextPage, hasNextPage, isError, isFetchingNextPage, isPending, refetch } =
    commentsQuery;

  const comments = useMemo(
    () => toPostComments(data?.pages.flatMap((page) => page.data.items) ?? []),
    [data],
  );

  const handleLoadMoreComments = useCallback(() => {
    if (!hasNextPage || isError || isFetchingNextPage) {
      return;
    }

    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isError, isFetchingNextPage]);

  const handleCommentSubmit = useCallback(
    (content: string) => {
      if (postId === null) {
        return;
      }

      requireAuth(() => {
        createCommentMutation.mutate(
          {
            payload: { content },
            postId,
          },
          {
            onError: (error) => {
              setCommentFeedback({
                description: error.message || '댓글 등록에 실패했어요. 다시 시도해주세요.',
                type: 'critical',
              });
            },
            onSuccess: async ({ data }) => {
              setCommentFeedback({ description: '댓글이 등록되었어요', type: 'positive' });

              let commentsResult = await refetch();
              let hasCreatedComment = commentsResult.data?.pages.some((page) =>
                page.data.items.some((comment) => comment.id === data.id),
              );

              while (!hasCreatedComment && commentsResult.data?.pages.at(-1)?.data.next_cursor) {
                commentsResult = await fetchNextPage();
                hasCreatedComment = commentsResult.data?.pages.some((page) =>
                  page.data.items.some((comment) => comment.id === data.id),
                );
              }

              if (hasCreatedComment) {
                setCommentIdToScroll(data.id);
              }

              onCommentCreated?.(postId);
            },
          },
        );
      });
    },
    [createCommentMutation, fetchNextPage, onCommentCreated, postId, refetch, requireAuth],
  );

  const handleCommentFeedbackDismiss = useCallback(() => {
    setCommentFeedback(null);
  }, []);

  const handleCommentScrolled = useCallback(() => {
    setCommentIdToScroll(null);
  }, []);

  return {
    commentFeedback,
    commentIdToScroll,
    comments,
    commentsError: isError,
    commentsLoading: isPending,
    hasMoreComments: hasNextPage,
    isCommentSubmitting: createCommentMutation.isPending,
    isLoadingMoreComments: isFetchingNextPage,
    onCommentFeedbackDismiss: handleCommentFeedbackDismiss,
    onCommentScrolled: handleCommentScrolled,
    onCommentSubmit: handleCommentSubmit,
    onLoadMoreComments: handleLoadMoreComments,
  };
}
