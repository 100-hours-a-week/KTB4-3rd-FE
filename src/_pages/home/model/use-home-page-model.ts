'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Post } from '@/entities/post';
import { getMapPinMarkerImage, type MapPinItem as MapPin } from '@/entities/map-pin';
import { useRequireAuth } from '@/features/login-required';
import { useCurrentUserQuery } from '@/features/user-profile';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';
import type { MapCoordinate } from '@/shared/types/common';
import type { MapMarker, MapRef, MapViewport } from '@/shared/ui/map';

import { useMapPinsQuery } from '@/_pages/home/api/map-pins';
import { useNearbyPostsQuery } from '@/_pages/home/api/nearby-posts';
import type { SelectedPost } from '@/_pages/home/model/home-types';
import { useHomeCompanionModel } from '@/_pages/home/model/use-home-companion-model';
import { useHomeCommunityModel } from '@/_pages/home/model/use-home-community-model';

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
  const { requireAuth } = useRequireAuth();
  const [selectedPost, setSelectedPost] = useState<SelectedPost | null>(null);
  const [userLocation, setUserLocation] = useState<MapCoordinate | null>(null);
  const [mapViewport, setMapViewport] = useState<MapViewport | null>(null);
  const mapRef = useRef<MapRef>(null);

  const currentUserQuery = useCurrentUserQuery();
  const mapPinsQuery = useMapPinsQuery(mapViewport);
  const nearbyPostsQuery = useNearbyPostsQuery(userLocation, mapViewport);
  const companionModel = useHomeCompanionModel({ requireAuth, selectedPost });
  const communityModel = useHomeCommunityModel({ requireAuth, selectedPost });
  const { onClose: onCompanionClose, onRetry: onCompanionRetry } = companionModel;
  const { onClose: onCommunityClose, onRetry: onCommunityRetry } = communityModel;

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

  const selectedDetail = (() => {
    if (selectedPost?.type === 'COMPANION') {
      return companionModel.detail;
    }

    if (selectedPost?.type === 'COMMUNITY') {
      return communityModel.detail;
    }

    return null;
  })();
  const selectedDetailState = (() => {
    if (selectedPost?.type === 'COMPANION') {
      return companionModel.detailState;
    }

    if (selectedPost?.type === 'COMMUNITY') {
      return communityModel.detailState;
    }

    return null;
  })();
  const selectedDetailIsNotFound = selectedDetailState?.isNotFound ?? false;

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
        onCommunityClose();
        onCompanionClose();
        setSelectedPost(null);
      }
    },
    [onCommunityClose, onCompanionClose],
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
    if (selectedPost?.type === 'COMPANION') {
      onCompanionRetry();
    }

    if (selectedPost?.type === 'COMMUNITY') {
      onCommunityRetry();
    }
  }, [onCommunityRetry, onCompanionRetry, selectedPost?.type]);

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
      commentProps: communityModel.commentProps,
      companionProps: companionModel.companionProps,
      detailError: selectedDetailState?.isError ?? false,
      detailLoading: selectedDetailState?.isLoading ?? false,
      onOpenChange: handleDetailModalChange,
      onRetry: handleRetrySelectedDetail,
      post: selectedPost,
      postDetail: selectedDetail,
      postNotFound: selectedDetailIsNotFound,
    },
  };
}
