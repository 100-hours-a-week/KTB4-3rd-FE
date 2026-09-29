'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import {
  PostDetailSkeleton,
  type CommunityPost,
  type CommunityPostDetail,
  type CompanionPostDetail,
  type PostComment,
  type PostDetail,
  toPostComments,
} from '@/entities/post';
import {
  CompanionPostDetail as CompanionPostDetailView,
  CommunityPostDetail as CommunityPostDetailView,
  type CommunityPostCommentFeedback,
} from '@/features/post-detail';
import { useRequireAuth } from '@/features/login-required';
import { useJoinCompanionMutation } from '@/features/join-companion';
import { useCreateCommunityPostCommentMutation } from '@/features/post-comment';
import {
  type CompanionPostDetailData,
  useCompanionPostDetailQuery,
} from '@/_pages/post-detail/api/companion-posts';
import {
  type CommunityPostDetailData,
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

function toCompanionPostDetail(data: CompanionPostDetailData): CompanionPostDetail {
  return {
    type: 'COMPANION',
    id: data.id,
    title: data.title,
    description: data.content,
    author: { nickname: data.author.nickname, profile_image_url: null },
    transport_type: data.transport_type,
    distance_m: 0,
    current_count: data.current_count,
    capacity: data.capacity,
    departure_at: data.departure_at,
    departure_location: data.origin_name,
    destination: data.dest_name,
    is_expired: data.is_expired,
    participants: (data.participants ?? []).map((participant, index) => ({
      id: index + 1,
      nickname: participant.nickname,
      profile_image_url: participant.profile_image_url,
    })),
  };
}

function toCommunityPostDetail(
  data: CommunityPostDetailData,
  comments: readonly PostComment[],
): CommunityPostDetail {
  const post: CommunityPost = {
    type: 'COMMUNITY',
    id: data.id,
    title: data.title,
    author: { nickname: data.author.nickname, profile_image_url: null },
    distance_m: 0,
    comment_count: data.comment_count,
    created_at: data.created_at,
  };

  return {
    ...post,
    description: data.content,
    comments,
  };
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
  const [commentFeedback, setCommentFeedback] = useState<CommunityPostCommentFeedback | null>(null);
  const [joinErrorMessage, setJoinErrorMessage] = useState<string | null>(null);

  const postId = parsePostId(params.postId);
  const requestedType = parsePostType(searchParams.get('type'));
  const companionPostId = postId !== null && requestedType !== 'community' ? postId : null;
  const communityPostId = postId !== null && requestedType !== 'companion' ? postId : null;

  const companionDetailQuery = useCompanionPostDetailQuery(companionPostId);
  const communityDetailQuery = useCommunityPostDetailQuery(communityPostId);
  const communityCommentsQuery = useCommunityPostCommentsQuery(
    communityDetailQuery.data ? communityPostId : null,
  );
  const joinCompanionMutation = useJoinCompanionMutation();
  const createCommentMutation = useCreateCommunityPostCommentMutation();

  const communityComments = useMemo(
    () =>
      toPostComments(communityCommentsQuery.data?.pages.flatMap((page) => page.data.items) ?? []),
    [communityCommentsQuery.data],
  );

  const selectedDetail: PostDetail | null = useMemo(() => {
    if (companionDetailQuery.data) {
      return toCompanionPostDetail(companionDetailQuery.data.data);
    }

    if (communityDetailQuery.data) {
      return toCommunityPostDetail(communityDetailQuery.data.data, communityComments);
    }

    return null;
  }, [communityComments, communityDetailQuery.data, companionDetailQuery.data]);

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

  const handleJoinCompanion = () => {
    if (selectedDetail?.type !== 'COMPANION') {
      return;
    }

    setJoinErrorMessage(null);
    joinCompanionMutation.mutate(selectedDetail.id, {
      onError: (error) => {
        setJoinErrorMessage(
          error instanceof Error ? error.message : '채팅방 참여에 실패했어요. 다시 시도해주세요.',
        );
      },
      onSuccess: ({ data }) => {
        router.push(`/chatroom/${data.chat_room_id}`);
      },
    });
  };

  const handleLoadMoreComments = () => {
    if (
      !communityCommentsQuery.hasNextPage ||
      communityCommentsQuery.isFetchingNextPage ||
      communityCommentsQuery.isError
    ) {
      return;
    }

    void communityCommentsQuery.fetchNextPage();
  };

  const handleCommentSubmit = (content: string) => {
    if (selectedDetail?.type !== 'COMMUNITY') {
      return;
    }

    requireAuth(() => {
      createCommentMutation.mutate(
        { payload: { content }, postId: selectedDetail.id },
        {
          onError: (error) => {
            setCommentFeedback({
              description: getErrorMessage(error),
              type: 'critical',
            });
          },
          onSuccess: () => {
            setCommentFeedback({ description: '댓글이 등록되었어요', type: 'positive' });
            void queryClient.invalidateQueries({ queryKey: communityPostQueries.all() });
          },
        },
      );
    });
  };

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
            isJoining={joinCompanionMutation.isPending}
            joinErrorMessage={joinErrorMessage}
            layout="page"
            onJoinClick={handleJoinCompanion}
            onJoinErrorDismiss={() => setJoinErrorMessage(null)}
            post={selectedDetail}
          />
        ) : null}
        {selectedDetail?.type === 'COMMUNITY' ? (
          <CommunityPostDetailView
            commentFeedback={commentFeedback}
            commentsError={communityCommentsQuery.isError}
            commentsLoading={communityCommentsQuery.isPending}
            hasMoreComments={communityCommentsQuery.hasNextPage}
            isCommentSubmitting={createCommentMutation.isPending}
            isLoadingMoreComments={communityCommentsQuery.isFetchingNextPage}
            layout="page"
            onCommentFeedbackDismiss={() => setCommentFeedback(null)}
            onCommentSubmit={handleCommentSubmit}
            onLoadMoreComments={handleLoadMoreComments}
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
