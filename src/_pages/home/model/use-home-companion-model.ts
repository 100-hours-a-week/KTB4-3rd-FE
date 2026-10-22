'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { toCompanionPostDetail } from '@/entities/post';
import { useJoinCompanionWorkflow } from '@/features/join-companion';
import { ApiError } from '@/shared/api/client';
import { useCompanionPostDetailQuery } from '@/_pages/post-detail/api/companion-posts';

import type { SelectedPost } from './home-types';

type RequireAuth = (action: () => void) => void;

type UseHomeCompanionModelOptions = {
  requireAuth: RequireAuth;
  selectedPost: SelectedPost | null;
};

export function useHomeCompanionModel({ requireAuth, selectedPost }: UseHomeCompanionModelOptions) {
  const router = useRouter();
  const selectedCompanionId = selectedPost?.type === 'COMPANION' ? selectedPost.id : null;
  const detailQuery = useCompanionPostDetailQuery(selectedCompanionId);

  const handleJoined = useCallback(
    (chatRoomId: number) => {
      router.push(`/chatroom/${chatRoomId}`);
    },
    [router],
  );

  const joinWorkflow = useJoinCompanionWorkflow({
    companionId: selectedCompanionId,
    onJoined: handleJoined,
    requireAuth,
  });
  const { refetch } = detailQuery;

  const detail = useMemo(() => {
    if (selectedPost?.type !== 'COMPANION' || !detailQuery.data) {
      return null;
    }

    const summary = selectedPost.summary;

    return toCompanionPostDetail(
      detailQuery.data.data,
      summary?.type === 'COMPANION' ? summary : undefined,
    );
  }, [detailQuery.data, selectedPost]);

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
    companionProps: joinWorkflow,
    onClose: joinWorkflow.onJoinErrorDismiss,
    onRetry: handleRetry,
  };
}
