'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getMapPinMarkerImage } from '@/entities/map-pin';
import {
  PostList,
  type CommunityPost,
  type CompanionPost,
  type CommunityPostComment,
  type Post,
  type PostComment,
  type PostDetail,
  type CompanionPostDetail,
  type CommunityPostDetail,
} from '@/entities/post';
import {
  CompanionPostDetail as CompanionPostDetailView,
  CommunityPostDetail as CommunityPostDetailView,
  type CommunityPostCommentFeedback,
} from '@/features/post-detail';
import { useRequireAuth } from '@/features/login-required';
import { PostCreateFab } from '@/features/post-create';
import { useJoinCompanionMutation } from '@/features/join-companion';
import { useCreateCommunityPostCommentMutation } from '@/features/post-comment';
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
import { Avatar } from '@/shared/ui/avatar';
import { Header } from '@/shared/ui/header';
import { Icon } from '@/shared/ui/icon';
import { Logo } from '@/shared/ui/logo';
import { Map, MyLocationButton, type MapMarker, type MapViewport } from '@/shared/ui/map';
import type { MapCoordinate } from '@/shared/types/common';
import { ResultSection } from '@/shared/ui/result-section';
import { Snackbar } from '@/shared/ui/snackbar';
import { SnackbarViewport } from '@/shared/ui/snackbar-viewport';
import { Text } from '@/shared/ui/text';

type PositionedPost = {
  position: MapCoordinate;
  post: Post;
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

function getPositionedPost(post: Post, mapPins: readonly MapPin[]): PositionedPost | null {
  const mapPin = mapPins.find((pin) => getPostMarkerId(pin) === getPostMarkerId(post));

  return mapPin
    ? {
        position: { lat: mapPin.lat, lng: mapPin.lng },
        post,
      }
    : null;
}

function toCompanionPostDetail(
  post: CompanionPost,
  data: CompanionPostDetailData,
): CompanionPostDetail {
  return {
    ...post,
    id: data.id,
    title: data.title,
    description: data.content,
    transport_type: data.transport_type,
    departure_at: data.departure_at,
    is_expired: data.is_expired,
    current_count: data.current_count,
    capacity: data.capacity,
    author: { ...post.author, nickname: data.author.nickname },
    departure_location: data.origin_name,
    destination: data.dest_name,
    participants: data.participants.map((participant, index) => ({
      ...participant,
      id: index + 1,
    })),
  };
}

function toCommunityPostDetail(
  post: CommunityPost,
  data: CommunityPostDetailData,
  comments: readonly PostComment[],
): CommunityPostDetail {
  return {
    ...post,
    id: data.id,
    title: data.title,
    description: data.content,
    author: { ...post.author, nickname: data.author.nickname },
    comment_count: data.comment_count,
    created_at: data.created_at,
    comments,
  };
}

function toPostComments(comments: readonly CommunityPostComment[]): PostComment[] {
  return comments.map((comment) => ({
    id: comment.id,
    author: {
      nickname: comment.author.nickname,
      profile_image_url: null,
    },
    content: comment.content,
  }));
}

export function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { requireAuth } = useRequireAuth();
  const [selectedPost, setSelectedPost] = useState<PositionedPost | null>(null);
  const [commentFeedback, setCommentFeedback] = useState<CommunityPostCommentFeedback | null>(null);
  const [joinErrorMessage, setJoinErrorMessage] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<MapCoordinate | null>(null);
  const [mapViewport, setMapViewport] = useState<MapViewport | null>(null);

  const selectedCompanionId = selectedPost?.post.type === 'COMPANION' ? selectedPost.post.id : null;
  const selectedCommunityId = selectedPost?.post.type === 'COMMUNITY' ? selectedPost.post.id : null;

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
  const mapPinsQuery = useMapPinsQuery(mapViewport, userLocation !== null);
  const nearbyPostsQuery = useNearbyPostsQuery(userLocation, mapViewport);
  const mapPins = useMemo(() => mapPinsQuery.data?.data.items ?? [], [mapPinsQuery.data]);
  const nearbyPosts = useMemo(
    () => nearbyPostsQuery.data?.data.items ?? [],
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
    if (selectedPost?.post.type === 'COMPANION' && companionDetailQuery.data) {
      return toCompanionPostDetail(selectedPost.post, companionDetailQuery.data.data);
    }

    if (selectedPost?.post.type === 'COMMUNITY' && communityDetailQuery.data) {
      return toCommunityPostDetail(
        selectedPost.post,
        communityDetailQuery.data.data,
        communityComments,
      );
    }

    return null;
  }, [companionDetailQuery.data, communityComments, communityDetailQuery.data, selectedPost]);

  let selectedDetailQuery: typeof companionDetailQuery | typeof communityDetailQuery | null = null;

  if (selectedPost?.post.type === 'COMPANION') {
    selectedDetailQuery = companionDetailQuery;
  } else if (selectedPost?.post.type === 'COMMUNITY') {
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
      const post = nearbyPosts.find(
        (nearbyPost) => getPostMarkerId(nearbyPost) === String(marker.id),
      );

      if (mapPin && post) {
        setSelectedPost({
          position: { lat: mapPin.lat, lng: mapPin.lng },
          post,
        });
      }
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
            onSuccess: () => {
              setCommentFeedback({ description: '댓글이 등록되었어요', type: 'positive' });
              void queryClient.invalidateQueries({ queryKey: communityPostQueries.all() });
            },
          },
        );
      });
    },
    [createCommentMutation, queryClient, requireAuth, selectedCommunityId],
  );

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[393px] overflow-hidden bg-[var(--color-bg-layer-fill)]">
      <Header
        className="!absolute inset-x-0 top-0 z-30 bg-transparent"
        leftSlot={
          <span className="pt-2 pl-1.5">
            <Logo alt="모여타" size={27} variant="text" />
          </span>
        }
        rightSlot={
          <span className="pt-3 pr-1.5">
            <Avatar alt="프로필" className="size-[42px]" size="md" />
          </span>
        }
      />

      <main className="relative h-[calc(100dvh-72px)] min-h-[780px]">
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
          showCurrentLocationButton={false}
          showZoomControls={false}
          viewportDebounceMs={300}
        >
          <PostCreateFab
            className="absolute right-4 bottom-[190px] z-30"
            leftSlot={<Icon name="plus" size={24} />}
            onClick={handlePostCreate}
          >
            글쓰기
          </PostCreateFab>

          <MyLocationButton className="absolute right-4 bottom-[134px] z-20" />
        </Map>
      </main>

      <BottomSheet
        bottomOffset="calc(72px + env(safe-area-inset-bottom, 0px))"
        className="mx-auto w-full max-w-[393px]"
        defaultSnapPoint="110px"
        modal={false}
        open={selectedPost === null}
        showBackdrop={false}
        snapPoints={['110px', 0.5, 0.7]}
        title="근처 핀 게시글"
        description="가까운 순"
      >
        {nearbyPostsQuery.isPending ? (
          <Text className="block p-6" color="fg.neutralSubtle" variant="t4Regular">
            게시글을 불러오는 중이에요.
          </Text>
        ) : null}
        {nearbyPostsQuery.isError ? (
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
        {!nearbyPostsQuery.isPending && !nearbyPostsQuery.isError && nearbyPosts.length === 0 ? (
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
        {!nearbyPostsQuery.isPending && !nearbyPostsQuery.isError && nearbyPosts.length > 0 ? (
          <PostList items={nearbyPosts} onItemClick={handlePostClick} />
        ) : null}
      </BottomSheet>

      {selectedPost && !selectedDetailIsNotFound ? (
        <BottomModal
          bottomOffset="calc(72px + env(safe-area-inset-bottom, 0px) + 8px)"
          href={`/posts/${selectedPost.post.id}`}
          open
          onOpenChange={handleDetailModalChange}
        >
          {selectedPost.post.type === 'COMPANION' && companionDetailQuery.isPending ? (
            <Text className="block p-6" color="fg.neutralSubtle" variant="t4Regular">
              게시글을 불러오는 중이에요.
            </Text>
          ) : null}
          {selectedPost.post.type === 'COMMUNITY' && communityDetailQuery.isPending ? (
            <Text className="block p-6" color="fg.neutralSubtle" variant="t4Regular">
              게시글을 불러오는 중이에요.
            </Text>
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
              commentsError={isCommentsError}
              commentsLoading={isCommentsPending}
              hasMoreComments={hasNextComments}
              isCommentSubmitting={createCommentMutation.isPending}
              isLoadingMoreComments={isFetchingNextComments}
              onCommentFeedbackDismiss={() => setCommentFeedback(null)}
              onCommentSubmit={handleCommentSubmit}
              onLoadMoreComments={handleLoadMoreComments}
              post={selectedDetail}
            />
          ) : null}
        </BottomModal>
      ) : null}

      <BottomNav className="!fixed !right-auto !bottom-0 !left-1/2 !w-full !max-w-[393px] !-translate-x-1/2" />
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
    </div>
  );
}
