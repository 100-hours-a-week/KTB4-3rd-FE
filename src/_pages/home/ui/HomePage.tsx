'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getMapPinMarkerImage } from '@/entities/map-pin';
import {
  PostList,
  PostDetailSkeleton,
  type CommunityPost,
  type CompanionPost,
  type Post,
  type PostComment,
  type PostDetail,
  type CompanionPostDetail,
  type CommunityPostDetail,
  toPostComments,
} from '@/entities/post';
import {
  CompanionPostDetail as CompanionPostDetailView,
  CommunityPostDetail as CommunityPostDetailView,
  type CommunityPostCommentFeedback,
} from '@/features/post-detail';
import { HeaderUser } from '@/features/header-user';
import { useRequireAuth } from '@/features/login-required';
import { PostCreateFab } from '@/features/post-create';
import { useJoinCompanionMutation } from '@/features/join-companion';
import { useCreateCommunityPostCommentMutation } from '@/features/post-comment';
import { useCurrentUserQuery } from '@/features/user-profile';
import { type MapPin, useMapPinsQuery } from '@/_pages/home/api/map-pins';
import { useNearbyPostsQuery } from '@/_pages/home/api/nearby-posts';
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
import { ApiError } from '@/shared/api/client';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { BottomModal } from '@/shared/ui/bottom-modal';
import { BottomNav } from '@/shared/ui/BottomNav';
import { Header } from '@/shared/ui/header';
import { Icon } from '@/shared/ui/icon';
import { Logo } from '@/shared/ui/logo';
import {
  Map,
  MyLocationButton,
  type MapMarker,
  type MapRef,
  type MapViewport,
} from '@/shared/ui/map';
import type { MapCoordinate } from '@/shared/types/common';
import { ResultSection } from '@/shared/ui/result-section';
import { Snackbar } from '@/shared/ui/snackbar';
import { SnackbarViewport } from '@/shared/ui/snackbar-viewport';
import { Text } from '@/shared/ui/text';

import { HomeNearbyPostsSkeleton } from './home-page-loading';

type SelectedPost = {
  id: number;
  position: MapCoordinate;
  summary?: Post;
  type: Post['type'];
};

const POST_LOCATION_ROUTE = '/post/create/location';
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
const emptyPostsIcon = (
  <Image
    alt=""
    aria-hidden="true"
    height={66}
    src="/icons/seed/icon_document_tray_line.svg"
    width={66}
  />
);

function getPostMarkerId(post: Pick<Post, 'type' | 'id'> | MapPin) {
  return `${post.type}-${post.id}`;
}

function getPositionedPost(post: Post, mapPins: readonly MapPin[]): SelectedPost | null {
  const mapPin = mapPins.find((pin) => getPostMarkerId(pin) === getPostMarkerId(post));

  return mapPin
    ? {
        id: post.id,
        position: { lat: mapPin.lat, lng: mapPin.lng },
        summary: post,
        type: post.type,
      }
    : null;
}

function toCompanionPostDetail(
  post: CompanionPost | undefined,
  data: CompanionPostDetailData,
): CompanionPostDetail {
  const summary: CompanionPost = post ?? {
    type: 'COMPANION',
    id: data.id,
    title: data.title,
    author: { nickname: data.author.nickname, profile_image_url: null },
    transport_type: data.transport_type,
    distance_m: 0,
    current_count: data.current_count,
    capacity: data.capacity,
    departure_at: data.departure_at,
    is_expired: data.is_expired,
  };

  return {
    ...summary,
    id: data.id,
    title: data.title,
    description: data.content,
    transport_type: data.transport_type,
    departure_at: data.departure_at,
    is_expired: data.is_expired,
    current_count: data.current_count,
    capacity: data.capacity,
    author: { ...summary.author, nickname: data.author.nickname },
    departure_location: data.origin_name,
    destination: data.dest_name,
    participants: (data.participants ?? []).map((participant, index) => ({
      ...participant,
      id: index + 1,
    })),
  };
}

function toCommunityPostDetail(
  post: CommunityPost | undefined,
  data: CommunityPostDetailData,
  comments: readonly PostComment[],
): CommunityPostDetail {
  const summary: CommunityPost = post ?? {
    type: 'COMMUNITY',
    id: data.id,
    title: data.title,
    author: { nickname: data.author.nickname, profile_image_url: null },
    distance_m: 0,
    comment_count: data.comment_count,
    created_at: data.created_at,
  };

  return {
    ...summary,
    id: data.id,
    title: data.title,
    description: data.content,
    author: { ...summary.author, nickname: data.author.nickname },
    comment_count: data.comment_count,
    created_at: data.created_at,
    comments,
  };
}

export function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { requireAuth } = useRequireAuth();
  const [selectedPost, setSelectedPost] = useState<SelectedPost | null>(null);
  const [commentFeedback, setCommentFeedback] = useState<CommunityPostCommentFeedback | null>(null);
  const [commentIdToScroll, setCommentIdToScroll] = useState<number | null>(null);
  const [joinErrorMessage, setJoinErrorMessage] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<MapCoordinate | null>(null);
  const [mapViewport, setMapViewport] = useState<MapViewport | null>(null);
  const mapRef = useRef<MapRef>(null);
  const loadMorePostsRef = useRef<HTMLDivElement>(null);
  const currentUserQuery = useCurrentUserQuery();

  const selectedCompanionId = selectedPost?.type === 'COMPANION' ? selectedPost.id : null;
  const selectedCommunityId = selectedPost?.type === 'COMMUNITY' ? selectedPost.id : null;

  const companionDetailQuery = useCompanionPostDetailQuery(selectedCompanionId);
  const joinCompanionMutation = useJoinCompanionMutation();
  const communityDetailQuery = useCommunityPostDetailQuery(selectedCommunityId);
  const communityCommentsQuery = useCommunityPostCommentsQuery(selectedCommunityId);
  const createCommentMutation = useCreateCommunityPostCommentMutation();
  const {
    fetchNextPage: fetchNextComments,
    hasNextPage: hasNextComments,
    isError: isCommentsError,
    isFetchingNextPage: isFetchingNextComments,
    isPending: isCommentsPending,
  } = communityCommentsQuery;
  const mapPinsQuery = useMapPinsQuery(mapViewport);
  const nearbyPostsQuery = useNearbyPostsQuery(userLocation, mapViewport);
  const {
    fetchNextPage: fetchNextNearbyPosts,
    hasNextPage: hasNextNearbyPosts,
    isError: isNearbyPostsError,
    isFetchingNextPage: isFetchingNextNearbyPosts,
  } = nearbyPostsQuery;
  const mapPins = useMemo(() => mapPinsQuery.data?.data.items ?? [], [mapPinsQuery.data]);
  const nearbyPosts = useMemo(
    () => nearbyPostsQuery.data?.pages.flatMap((page) => page.data.items) ?? [],
    [nearbyPostsQuery.data],
  );
  const communityComments = useMemo(
    () =>
      toPostComments(communityCommentsQuery.data?.pages.flatMap((page) => page.data.items) ?? []),
    [communityCommentsQuery.data],
  );
  const mapMarkers = useMemo(
    () =>
      mapPins.map((pin) => ({
        id: getPostMarkerId(pin),
        image: getMapPinMarkerImage(pin.type === 'COMPANION' ? 'accompany' : 'community'),
        position: { lat: pin.lat, lng: pin.lng },
        title: `${pin.type === 'COMPANION' ? '동행모집' : '커뮤니티'} 게시글 ${pin.id}`,
      })),
    [mapPins],
  );

  const selectedDetail: PostDetail | null = useMemo(() => {
    if (selectedPost?.type === 'COMPANION' && companionDetailQuery.data) {
      const summary = selectedPost.summary;

      return toCompanionPostDetail(
        summary?.type === 'COMPANION' ? summary : undefined,
        companionDetailQuery.data.data,
      );
    }

    if (selectedPost?.type === 'COMMUNITY' && communityDetailQuery.data) {
      const summary = selectedPost.summary;

      return toCommunityPostDetail(
        summary?.type === 'COMMUNITY' ? summary : undefined,
        communityDetailQuery.data.data,
        communityComments,
      );
    }

    return null;
  }, [companionDetailQuery.data, communityComments, communityDetailQuery.data, selectedPost]);

  let selectedDetailQuery: typeof companionDetailQuery | typeof communityDetailQuery | null = null;

  if (selectedPost?.type === 'COMPANION') {
    selectedDetailQuery = companionDetailQuery;
  } else if (selectedPost?.type === 'COMMUNITY') {
    selectedDetailQuery = communityDetailQuery;
  }
  const selectedDetailIsNotFound =
    selectedDetailQuery?.error instanceof ApiError && selectedDetailQuery.error.status === 404;

  useEffect(() => {
    if (!selectedPost || !selectedDetailIsNotFound) {
      return;
    }

    useSnackbarStore.getState().showSnackbar('존재하지 않는 게시글이에요.', 'critical');
  }, [selectedDetailIsNotFound, selectedPost]);

  const handleMarkerClick = useCallback(
    (marker: MapMarker) => {
      const mapPin = mapPins.find((pin) => getPostMarkerId(pin) === String(marker.id));
      const summary = nearbyPosts.find(
        (nearbyPost) => getPostMarkerId(nearbyPost) === String(marker.id),
      );

      if (!mapPin) {
        return;
      }

      setSelectedPost({
        id: mapPin.id,
        position: { lat: mapPin.lat, lng: mapPin.lng },
        summary,
        type: mapPin.type,
      });
    },
    [mapPins, nearbyPosts],
  );

  const handlePostClick = useCallback(
    (post: Post) => {
      const nextPost = getPositionedPost(post, mapPins);

      if (nextPost) {
        setSelectedPost(nextPost);
      }
    },
    [mapPins],
  );

  const handleMapViewportChange = useCallback((viewport: MapViewport) => {
    setMapViewport(viewport);
  }, []);

  const handleUserLocationChange = useCallback((coordinate: MapCoordinate) => {
    setUserLocation(coordinate);
    setMapViewport(null);
  }, []);

  const handleCurrentLocation = useCallback(() => {
    mapRef.current?.requestCurrentLocation();
  }, []);

  const handlePostCreate = useCallback(() => {
    requireAuth(() => router.push(POST_LOCATION_ROUTE));
  }, [requireAuth, router]);

  const handleDetailModalChange = useCallback((open: boolean) => {
    if (!open) {
      setCommentFeedback(null);
      setJoinErrorMessage(null);
      setSelectedPost(null);
    }
  }, []);

  const handleJoinCompanion = useCallback(() => {
    if (selectedDetail?.type !== 'COMPANION') {
      return;
    }

    setJoinErrorMessage(null);
    joinCompanionMutation.mutate(selectedDetail.id, {
      onSuccess: ({ data }) => {
        setJoinErrorMessage(null);
        router.push(`/chatroom/${data.chat_room_id}`);
      },
      onError: (error) => {
        setJoinErrorMessage(
          error instanceof Error ? error.message : '채팅방 참여에 실패했어요. 다시 시도해주세요.',
        );
      },
    });
  }, [joinCompanionMutation, router, selectedDetail]);

  const handleLoadMoreComments = useCallback(() => {
    if (!hasNextComments || isCommentsError || isFetchingNextComments) {
      return;
    }

    void fetchNextComments();
  }, [fetchNextComments, hasNextComments, isCommentsError, isFetchingNextComments]);

  const handleLoadMorePosts = useCallback(() => {
    if (!hasNextNearbyPosts || isNearbyPostsError || isFetchingNextNearbyPosts) {
      return;
    }

    void fetchNextNearbyPosts();
  }, [fetchNextNearbyPosts, hasNextNearbyPosts, isFetchingNextNearbyPosts, isNearbyPostsError]);

  useEffect(() => {
    const target = loadMorePostsRef.current;

    if (
      !target ||
      !hasNextNearbyPosts ||
      isNearbyPostsError ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextNearbyPosts) {
          handleLoadMorePosts();
        }
      },
      { rootMargin: '0px 0px 160px 0px' },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [handleLoadMorePosts, hasNextNearbyPosts, isFetchingNextNearbyPosts, isNearbyPostsError]);

  const handleCommentSubmit = useCallback(
    (content: string) => {
      if (selectedCommunityId === null) {
        return;
      }

      requireAuth(() => {
        createCommentMutation.mutate(
          {
            payload: { content },
            postId: selectedCommunityId,
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

              let commentsResult = await communityCommentsQuery.refetch();
              let hasCreatedComment = commentsResult.data?.pages.some((page) =>
                page.data.items.some((comment) => comment.id === data.id),
              );

              while (!hasCreatedComment && commentsResult.data?.pages.at(-1)?.data.next_cursor) {
                commentsResult = await communityCommentsQuery.fetchNextPage();
                hasCreatedComment = commentsResult.data?.pages.some((page) =>
                  page.data.items.some((comment) => comment.id === data.id),
                );
              }

              if (hasCreatedComment) {
                setCommentIdToScroll(data.id);
              }

              void queryClient.invalidateQueries({
                queryKey: communityPostQueries.detail(selectedCommunityId).queryKey,
              });
            },
          },
        );
      });
    },
    [communityCommentsQuery, createCommentMutation, queryClient, requireAuth, selectedCommunityId],
  );

  return (
    <>
      <div className="relative mx-auto min-h-dvh w-full max-w-[393px] overflow-hidden bg-[var(--color-bg-layer-fill)]">
        <Header
          className="z-30 bg-transparent"
          leftSlot={
            <span className="pt-2 pl-1.5">
              <Logo alt="모여타" size={27} variant="text" />
            </span>
          }
          rightSlot={
            <span className="pt-3 pr-1.5">
              <HeaderUser user={currentUserQuery.data?.data} />
            </span>
          }
        />

        <main className="relative h-[calc(100dvh-72px)] min-h-0">
          <Map
            center={selectedPost?.position}
            className="h-full"
            clusterMarkers
            markerFocusLevel={2}
            markerFocusOffset={{ y: 160 }}
            markers={mapMarkers}
            onMarkerClick={handleMarkerClick}
            onUserLocationChange={handleUserLocationChange}
            onViewportChange={handleMapViewportChange}
            locateOnMount
            ref={mapRef}
            showCurrentLocationButton={false}
            showZoomControls={false}
            viewportDebounceMs={300}
          />
        </main>

        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto h-dvh w-full max-w-[393px]"
          data-testid="home-map-controls"
        >
          <PostCreateFab
            className="pointer-events-auto absolute right-4 bottom-[calc(72px+env(safe-area-inset-bottom,0px)+190px)]"
            leftSlot={<Icon name="plus" size={24} />}
            onClick={handlePostCreate}
          >
            글쓰기
          </PostCreateFab>

          <MyLocationButton
            className="pointer-events-auto absolute right-4 bottom-[calc(72px+env(safe-area-inset-bottom,0px)+134px)]"
            onClick={handleCurrentLocation}
          />
        </div>

        <BottomSheet
          bottomOffset="calc(72px + env(safe-area-inset-bottom, 0px))"
          className="mx-auto w-full max-w-[393px]"
          defaultSnapPoint="110px"
          modal={false}
          open={selectedPost === null}
          showBackdrop={false}
          showScrollFog
          scrollContentKey={nearbyPosts.length}
          snapPoints={['110px', 0.5, 0.7]}
          title="근처 핀 게시글"
          description="가까운 순"
        >
          {nearbyPostsQuery.isPending ? <HomeNearbyPostsSkeleton /> : null}
          {isNearbyPostsError && nearbyPosts.length === 0 ? (
            <ResultSection
              buttons="primary"
              description={POST_ERROR_DESCRIPTION}
              icon={postErrorIcon}
              primaryButtonProps={{ onClick: () => void nearbyPostsQuery.refetch() }}
              primaryLabel="다시 불러오기"
              size="medium"
              title={POST_ERROR_TITLE}
            />
          ) : null}
          {!nearbyPostsQuery.isPending && !isNearbyPostsError && nearbyPosts.length === 0 ? (
            <ResultSection
              buttons="primary"
              description="가장 먼저 글을 등록하고 동행자를 찾아보세요"
              icon={emptyPostsIcon}
              primaryButtonProps={{ onClick: handlePostCreate }}
              primaryLabel="글 등록하기"
              size="medium"
              title="등록된 게시글이 없어요"
            />
          ) : null}
          {!nearbyPostsQuery.isPending && nearbyPosts.length > 0 ? (
            <PostList
              className="pb-[calc(72px+env(safe-area-inset-bottom,0px))]"
              items={nearbyPosts}
              onItemClick={handlePostClick}
            />
          ) : null}
          {hasNextNearbyPosts && nearbyPosts.length > 0 ? (
            <div
              aria-busy={isFetchingNextNearbyPosts}
              aria-live="polite"
              className="flex min-h-8 items-center justify-center py-2"
              data-testid="home-post-list-load-more"
              ref={loadMorePostsRef}
            >
              {isFetchingNextNearbyPosts ? (
                <Text color="fg.neutralSubtle" variant="t4Regular">
                  게시글을 불러오는 중이에요.
                </Text>
              ) : null}
            </div>
          ) : null}
        </BottomSheet>

        {selectedPost && !selectedDetailIsNotFound ? (
          <BottomModal
            bottomOffset="calc(72px + env(safe-area-inset-bottom, 0px) + 8px)"
            href={`/posts/${selectedPost.id}?type=${selectedPost.type === 'COMPANION' ? 'companion' : 'community'}`}
            open
            onOpenChange={handleDetailModalChange}
          >
            {selectedPost.type === 'COMPANION' && companionDetailQuery.isPending ? (
              <PostDetailSkeleton type="COMPANION" />
            ) : null}
            {selectedPost.type === 'COMMUNITY' && communityDetailQuery.isPending ? (
              <PostDetailSkeleton type="COMMUNITY" />
            ) : null}
            {selectedDetailQuery?.isError && !selectedDetailIsNotFound ? (
              <ResultSection
                buttons="primary"
                description={POST_ERROR_DESCRIPTION}
                icon={postErrorIcon}
                primaryButtonProps={{ onClick: () => void selectedDetailQuery.refetch() }}
                primaryLabel="다시 불러오기"
                size="medium"
                title={POST_ERROR_TITLE}
              />
            ) : null}
            {selectedDetail?.type === 'COMPANION' ? (
              <CompanionPostDetailView
                joinErrorMessage={joinErrorMessage}
                isJoining={joinCompanionMutation.isPending}
                onJoinClick={handleJoinCompanion}
                onJoinErrorDismiss={() => setJoinErrorMessage(null)}
                post={selectedDetail}
              />
            ) : null}
            {selectedDetail?.type === 'COMMUNITY' ? (
              <CommunityPostDetailView
                commentFeedback={commentFeedback}
                commentIdToScroll={commentIdToScroll}
                commentsError={isCommentsError}
                commentsLoading={isCommentsPending}
                hasMoreComments={hasNextComments}
                isCommentSubmitting={createCommentMutation.isPending}
                isLoadingMoreComments={isFetchingNextComments}
                onCommentFeedbackDismiss={() => setCommentFeedback(null)}
                onCommentScrolled={() => setCommentIdToScroll(null)}
                onCommentSubmit={handleCommentSubmit}
                onLoadMoreComments={handleLoadMoreComments}
                post={selectedDetail}
              />
            ) : null}
          </BottomModal>
        ) : null}

        <BottomNav className="!fixed !right-auto !bottom-0 !left-1/2 !w-full !max-w-[393px] !-translate-x-1/2" />
      </div>
      {typeof document === 'undefined'
        ? null
        : createPortal(
            <>
              {mapPinsQuery.isError ? (
                <Snackbar
                  actionProps={{
                    children: '다시 시도',
                    onClick: () => void mapPinsQuery.refetch(),
                  }}
                  className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom,0px)+16px)] z-[2147483647] mx-auto"
                  description="핀 목록 조회 중 오류가 발생했어요"
                  open
                  timeout={0}
                  type="critical"
                />
              ) : null}
              <SnackbarViewport className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom,0px)+16px)] z-[2147483647] mx-auto" />
            </>,
            document.body,
          )}
    </>
  );
}
