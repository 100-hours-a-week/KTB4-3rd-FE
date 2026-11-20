'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { toCommunityPostDetail } from '@/entities/post';
import { useCommunityPostCommentWorkflow } from '@/features/post-comment';
import { ApiError } from '@/shared/api/client';
import {
  communityPostQueries,
  useCommunityPostCommentsQuery,
  useCommunityPostDetailQuery,
} from '@/_pages/post-detail/api/community-posts';

import type { SelectedPost } from './home-types';

type RequireAuth = (action: () => void) => void;

type UseHomeCommunityModelOptions = {
  requireAuth: RequireAuth;
  selectedPost: SelectedPost | null;
};

export function useHomeCommunityModel({ requireAuth, selectedPost }: UseHomeCommunityModelOptions) {
  const queryClient = useQueryClient();
  const selectedCommunityId = selectedPost?.type === 'COMMUNITY' ? selectedPost.id : null;
  const detailQuery = useCommunityPostDetailQuery(selectedCommunityId);
  const commentsQuery = useCommunityPostCommentsQuery(selectedCommunityId);
  const { refetch } = detailQuery;

  const handleCommentCreated = useCallback(
    (postId: number) => {
      void queryClient.invalidateQueries({
        queryKey: communityPostQueries.detail(postId).queryKey,
      });
    },
    [queryClient],
  );

  const commentWorkflow = useCommunityPostCommentWorkflow({
    commentsQuery,
    onCommentCreated: handleCommentCreated,
    postId: selectedCommunityId,
    requireAuth,
  });

  const detail = useMemo(() => {
    if (selectedPost?.type !== 'COMMUNITY' || !detailQuery.data) {
      return null;
    }

    const summary = selectedPost.summary;

    return toCommunityPostDetail(
      detailQuery.data.data,
      commentWorkflow.comments,
      summary?.type === 'COMMUNITY' ? summary : undefined,
    );
  }, [commentWorkflow.comments, detailQuery.data, selectedPost]);

  const detailIsNotFound =
    detailQuery.error instanceof ApiError && detailQuery.error.status === 404;

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    detail,
    detailState: {
      isError: detailQuery.isError,
      isLoading: detailQuery.isPending,
      isNotFound: detailIsNotFound,
    },
    commentProps: {
      commentFeedback: commentWorkflow.commentFeedback,
      commentIdToScroll: commentWorkflow.commentIdToScroll,
      commentsError: commentWorkflow.commentsError,
      commentsLoading: commentWorkflow.commentsLoading,
      hasMoreComments: commentWorkflow.hasMoreComments,
      isCommentSubmitting: commentWorkflow.isCommentSubmitting,
      isLoadingMoreComments: commentWorkflow.isLoadingMoreComments,
      onCommentFeedbackDismiss: commentWorkflow.onCommentFeedbackDismiss,
      onCommentScrolled: commentWorkflow.onCommentScrolled,
      onCommentSubmit: commentWorkflow.onCommentSubmit,
      onLoadMoreComments: commentWorkflow.onLoadMoreComments,
    },
    onClose: commentWorkflow.onCommentFeedbackDismiss,
    onRetry: handleRetry,
  };
}
