'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  PostDetailSkeleton,
  type PostDetail,
  toCompanionPostDetail,
  toCommunityPostDetail,
} from '@/entities/post';
import {
  CompanionPostDetail as CompanionPostDetailView,
  CommunityPostDetail as CommunityPostDetailView,
} from '@/features/post-detail';
import { useJoinCompanionWorkflow } from '@/features/join-companion';
import { useRequireAuth } from '@/features/login-required';
import { useCommunityPostCommentWorkflow } from '@/features/post-comment';
import { useCompanionPostDetailQuery } from '@/_pages/post-detail/api/companion-posts';
import {
  communityPostQueries,
  useCommunityPostCommentsQuery,
  useCommunityPostDetailQuery,
} from '@/_pages/post-detail/api/community-posts';
import { BackButton } from '@/shared/ui/back-button';
import { Header } from '@/shared/ui/header';
import { Icon } from '@/shared/ui/icon';
import { ResultSection } from '@/shared/ui/result-section';

type PostRouteType = 'companion' | 'community';

const POST_ERROR_TITLE = '게시글을 불러올 수 없어요';
const POST_ERROR_DESCRIPTION =
  '게시글을 불러오는 중 오류가 발생했어요.\n잠시 후 다시 시도해주세요.';

const postErrorIcon = (
  <Icon
    aria-hidden="true"
    color="var(--color-fg-critical)"
    name="exclamationmarkCircleFill"
    size={66}
  />
);

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePostId(value: string | string[] | undefined) {
  const parsed = Number(getFirstParam(value));

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parsePostType(value: string | null): PostRouteType | null {
  const normalizedValue = value?.toLowerCase();

  return normalizedValue === 'companion' || normalizedValue === 'community'
    ? normalizedValue
    : null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : POST_ERROR_DESCRIPTION;
}

function getDetailError(
  requestedType: PostRouteType | null,
  companionError: Error | null,
  communityError: Error | null,
) {
  if (requestedType === 'companion') {
    return companionError;
  }

  if (requestedType === 'community') {
    return communityError;
  }

  return companionError ?? communityError;
}

export function PostDetailPage() {
  const params = useParams<{ postId: string | string[] }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { requireAuth } = useRequireAuth();

  const postId = parsePostId(params.postId);
  const requestedType = parsePostType(searchParams.get('type'));
  const companionPostId = postId !== null && requestedType !== 'community' ? postId : null;
  const communityPostId = postId !== null && requestedType !== 'companion' ? postId : null;

  const companionDetailQuery = useCompanionPostDetailQuery(companionPostId);
  const communityDetailQuery = useCommunityPostDetailQuery(communityPostId);
  const communityCommentsQuery = useCommunityPostCommentsQuery(
    communityDetailQuery.data ? communityPostId : null,
  );
  const commentWorkflow = useCommunityPostCommentWorkflow({
    commentsQuery: communityCommentsQuery,
    onCommentCreated: (createdPostId) => {
      void queryClient.invalidateQueries({
        queryKey: communityPostQueries.detail(createdPostId).queryKey,
      });
    },
    postId: communityPostId,
    requireAuth,
  });

  const selectedDetail: PostDetail | null = useMemo(() => {
    if (companionDetailQuery.data) {
      return toCompanionPostDetail(companionDetailQuery.data.data);
    }

    if (communityDetailQuery.data) {
      return toCommunityPostDetail(communityDetailQuery.data.data, commentWorkflow.comments);
    }

    return null;
  }, [commentWorkflow.comments, communityDetailQuery.data, companionDetailQuery.data]);

  const joinWorkflow = useJoinCompanionWorkflow({
    companionId: selectedDetail?.type === 'COMPANION' ? selectedDetail.id : null,
    onJoined: (chatRoomId) => router.push(`/chatroom/${chatRoomId}`),
    requireAuth,
  });

  const isLoading =
    postId !== null &&
    selectedDetail === null &&
    ((companionPostId !== null && companionDetailQuery.isPending) ||
      (communityPostId !== null && communityDetailQuery.isPending));
  const isError =
    postId === null ||
    (!isLoading &&
      selectedDetail === null &&
      ((companionPostId !== null && companionDetailQuery.isError) ||
        (communityPostId !== null && communityDetailQuery.isError)));
  const detailError = getDetailError(
    requestedType,
    companionDetailQuery.error,
    communityDetailQuery.error,
  );

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[393px] bg-[var(--color-bg-layer-default)]">
      <Header leftSlot={<BackButton href="/" />} />
      <main className="min-h-dvh pt-[56px]">
        {isLoading ? <PostDetailSkeleton layout="page" /> : null}
        {isError ? (
          <ResultSection
            buttons="primary"
            description={
              postId === null ? '올바르지 않은 게시글 주소예요.' : getErrorMessage(detailError)
            }
            icon={postId === null ? undefined : postErrorIcon}
            primaryButtonProps={{ onClick: () => router.back() }}
            primaryLabel="돌아가기"
            size="medium"
            title={postId === null ? '게시글을 찾을 수 없어요' : POST_ERROR_TITLE}
          />
        ) : null}
        {selectedDetail?.type === 'COMPANION' ? (
          <CompanionPostDetailView
            isJoining={joinWorkflow.isJoining}
            joinErrorMessage={joinWorkflow.joinErrorMessage}
            layout="page"
            onJoinClick={joinWorkflow.onJoinClick}
            onJoinErrorDismiss={joinWorkflow.onJoinErrorDismiss}
            post={selectedDetail}
          />
        ) : null}
        {selectedDetail?.type === 'COMMUNITY' ? (
          <CommunityPostDetailView
            commentFeedback={commentWorkflow.commentFeedback}
            commentIdToScroll={commentWorkflow.commentIdToScroll}
            commentsError={commentWorkflow.commentsError}
            commentsLoading={commentWorkflow.commentsLoading}
            hasMoreComments={commentWorkflow.hasMoreComments}
            isCommentSubmitting={commentWorkflow.isCommentSubmitting}
            isLoadingMoreComments={commentWorkflow.isLoadingMoreComments}
            layout="page"
            onCommentFeedbackDismiss={commentWorkflow.onCommentFeedbackDismiss}
            onCommentScrolled={commentWorkflow.onCommentScrolled}
            onCommentSubmit={commentWorkflow.onCommentSubmit}
            onLoadMoreComments={commentWorkflow.onLoadMoreComments}
            post={selectedDetail}
          />
        ) : null}
      </main>
    </div>
  );
}

export function PostDetailPageLoading() {
  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[393px] bg-[var(--color-bg-layer-default)]">
      <Header leftSlot={<BackButton href="/" />} />
      <main className="min-h-dvh pt-[56px]">
        <PostDetailSkeleton layout="page" />
      </main>
    </div>
  );
}
