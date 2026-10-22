'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  type Post,
  type PostDetail,
  toCompanionPostDetail,
  toCommunityPostDetail,
} from '@/entities/post';
import { getMapPinMarkerImage } from '@/entities/map-pin';
import { useJoinCompanionWorkflow } from '@/features/join-companion';
import { useRequireAuth } from '@/features/login-required';
import { useCommunityPostCommentWorkflow } from '@/features/post-comment';
import { useCurrentUserQuery } from '@/features/user-profile';
import { useCompanionPostDetailQuery } from '@/_pages/post-detail/api/companion-posts';
import {
  communityPostQueries,
  useCommunityPostCommentsQuery,
  useCommunityPostDetailQuery,
} from '@/_pages/post-detail/api/community-posts';
import { ApiError } from '@/shared/api/client';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';
import type { MapCoordinate } from '@/shared/types/common';
import type { MapMarker, MapRef, MapViewport } from '@/shared/ui/map';

import { type MapPin, useMapPinsQuery } from '@/_pages/home/api/map-pins';
import { useNearbyPostsQuery } from '@/_pages/home/api/nearby-posts';
import type { SelectedPost } from '@/_pages/home/model/home-types';

const POST_LOCATION_ROUTE = '/post/create/location';

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

export function useHomePageModel() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { requireAuth } = useRequireAuth();
  const [selectedPost, setSelectedPost] = useState<SelectedPost | null>(null);
  const [userLocation, setUserLocation] = useState<MapCoordinate | null>(null);
  const [mapViewport, setMapViewport] = useState<MapViewport | null>(null);
  const mapRef = useRef<MapRef>(null);

  const currentUserQuery = useCurrentUserQuery();
  const selectedCompanionId = selectedPost?.type === 'COMPANION' ? selectedPost.id : null;
  const selectedCommunityId = selectedPost?.type === 'COMMUNITY' ? selectedPost.id : null;

  const mapPinsQuery = useMapPinsQuery(mapViewport);
  const nearbyPostsQuery = useNearbyPostsQuery(userLocation, mapViewport);
  const companionDetailQuery = useCompanionPostDetailQuery(selectedCompanionId);
  const communityDetailQuery = useCommunityPostDetailQuery(selectedCommunityId);
  const communityCommentsQuery = useCommunityPostCommentsQuery(selectedCommunityId);

  const handleJoined = useCallback(
    (chatRoomId: number) => {
      router.push(`/chatroom/${chatRoomId}`);
    },
    [router],
  );

  const handleCommentCreated = useCallback(
    (postId: number) => {
      void queryClient.invalidateQueries({
        queryKey: communityPostQueries.detail(postId).queryKey,
      });
    },
    [queryClient],
  );

  const joinWorkflow = useJoinCompanionWorkflow({
    companionId: selectedCompanionId,
    onJoined: handleJoined,
    requireAuth,
  });
  const commentWorkflow = useCommunityPostCommentWorkflow({
    commentsQuery: communityCommentsQuery,
    onCommentCreated: handleCommentCreated,
    postId: selectedCommunityId,
    requireAuth,
  });

  const mapPins = useMemo(() => mapPinsQuery.data?.data.items ?? [], [mapPinsQuery.data]);
  const nearbyPosts = useMemo(
    () => nearbyPostsQuery.data?.pages.flatMap((page) => page.data.items) ?? [],
    [nearbyPostsQuery.data],
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
        companionDetailQuery.data.data,
        summary?.type === 'COMPANION' ? summary : undefined,
      );
    }

    if (selectedPost?.type === 'COMMUNITY' && communityDetailQuery.data) {
      const summary = selectedPost.summary;

      return toCommunityPostDetail(
        communityDetailQuery.data.data,
        commentWorkflow.comments,
        summary?.type === 'COMMUNITY' ? summary : undefined,
      );
    }

    return null;
  }, [
    commentWorkflow.comments,
    companionDetailQuery.data,
    communityDetailQuery.data,
    selectedPost,
  ]);

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

  const handleDetailModalChange = useCallback(
    (open: boolean) => {
      if (!open) {
        commentWorkflow.onCommentFeedbackDismiss();
        joinWorkflow.onJoinErrorDismiss();
        setSelectedPost(null);
      }
    },
    [commentWorkflow, joinWorkflow],
  );

  const handleLoadMorePosts = useCallback(() => {
    if (
      !nearbyPostsQuery.hasNextPage ||
      nearbyPostsQuery.isError ||
      nearbyPostsQuery.isFetchingNextPage
    ) {
      return;
    }

    void nearbyPostsQuery.fetchNextPage();
  }, [nearbyPostsQuery]);

  const handleRetryNearbyPosts = useCallback(() => {
    void nearbyPostsQuery.refetch();
  }, [nearbyPostsQuery]);

  const handleRetryMapPins = useCallback(() => {
    void mapPinsQuery.refetch();
  }, [mapPinsQuery]);

  const handleRetrySelectedDetail = useCallback(() => {
    void selectedDetailQuery?.refetch();
  }, [selectedDetailQuery]);

  return {
    currentUser: currentUserQuery.data?.data,
    map: {
      center: selectedPost?.position,
      markers: mapMarkers,
      onMarkerClick: handleMarkerClick,
      onUserLocationChange: handleUserLocationChange,
      onViewportChange: handleMapViewportChange,
    },
    mapRef,
    mapControls: {
      onCreatePost: handlePostCreate,
      onCurrentLocation: handleCurrentLocation,
    },
    mapPinsError: {
      isError: mapPinsQuery.isError,
      onRetry: handleRetryMapPins,
    },
    nearbyPosts: {
      hasNextPage: nearbyPostsQuery.hasNextPage,
      isError: nearbyPostsQuery.isError,
      isFetchingNextPage: nearbyPostsQuery.isFetchingNextPage,
      isLoading: nearbyPostsQuery.isPending,
      onCreatePost: handlePostCreate,
      onLoadMore: handleLoadMorePosts,
      onPostClick: handlePostClick,
      onRetry: handleRetryNearbyPosts,
      open: selectedPost === null,
      posts: nearbyPosts,
    },
    postDetailModal: {
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
      companionProps: joinWorkflow,
      detailError: selectedDetailQuery?.isError ?? false,
      detailLoading: selectedDetailQuery?.isPending ?? false,
      onOpenChange: handleDetailModalChange,
      onRetry: handleRetrySelectedDetail,
      post: selectedPost,
      postDetail: selectedDetail,
      postNotFound: selectedDetailIsNotFound,
    },
  };
}
