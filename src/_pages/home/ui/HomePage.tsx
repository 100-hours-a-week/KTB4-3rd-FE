'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { getMapPinMarkerImage, type MapPinMarkerVariant } from '@/entities/map-pin';
import { PostList, type Post, type PostDetail } from '@/entities/post';
import { CompanionPostDetail, CommunityPostDetail } from '@/features/post-detail';
import { PostCreateFab } from '@/features/post-create';
import { type MapPin, useMapPinsQuery } from '@/_pages/home/api/map-pins';
import { useNearbyPostsQuery } from '@/_pages/home/api/nearby-posts';
import { BottomSheet, type BottomSheetSnapPoint } from '@/shared/ui/bottom-sheet';
import { BottomNav } from '@/shared/ui/BottomNav';
import { Avatar } from '@/shared/ui/avatar';
import { BottomModal } from '@/shared/ui/bottom-modal';
import { Dialog } from '@/shared/ui/dialog';
import { Header } from '@/shared/ui/header';
import { Icon } from '@/shared/ui/icon';
import { Logo } from '@/shared/ui/logo';
import {
  Map,
  MyLocationButton,
  type MapLocationError,
  type MapMarker,
  type MapRef,
  type MapViewport,
} from '@/shared/ui/map';
import type { MapCoordinate } from '@/shared/types/common';

type PositionedPost = {
  pinVariant: MapPinMarkerVariant;
  position: MapCoordinate;
  post: Post;
};

const mockPosts: PositionedPost[] = [
  {
    pinVariant: 'accompany',
    position: { lat: 37.5665, lng: 126.978 },
    post: {
      type: 'COMPANION',
      id: 1,
      title: '판교역까지 카풀할 분 찾아요',
      author: { nickname: '모여타', profile_image_url: null },
      transport_type: 'OWNED_CAR',
      distance_m: 320,
      current_count: 2,
      capacity: 4,
      departure_at: '2026-09-22T09:40:00.000Z',
      is_expired: false,
    },
  },
  {
    pinVariant: 'accompany',
    position: { lat: 37.5657, lng: 126.9791 },
    post: {
      type: 'COMPANION',
      id: 2,
      title: '신논현까지 함께 이동해요',
      author: { nickname: '타요', profile_image_url: null },
      transport_type: 'SUBWAY',
      distance_m: 540,
      current_count: 1,
      capacity: 4,
      departure_at: '2026-09-22T10:20:00.000Z',
      is_expired: false,
    },
  },
  {
    pinVariant: 'community',
    position: { lat: 37.5673, lng: 126.9774 },
    post: {
      type: 'COMMUNITY',
      id: 3,
      title: '판교역 근처 카페 추천',
      author: { nickname: '루디', profile_image_url: null },
      distance_m: 780,
      comment_count: 3,
      created_at: '2026-09-22T08:00:00.000Z',
    },
  },
  {
    pinVariant: 'community',
    position: { lat: 37.5669, lng: 126.98 },
    post: {
      type: 'COMMUNITY',
      id: 4,
      title: '오늘 저녁 같이 먹어요',
      author: { nickname: '하루', profile_image_url: null },
      distance_m: 920,
      comment_count: 5,
      created_at: '2026-09-22T08:30:00.000Z',
    },
  },
  {
    pinVariant: 'accompany',
    position: { lat: 37.5654, lng: 126.977 },
    post: {
      type: 'COMPANION',
      id: 5,
      title: '퇴근길 카풀 동행 구해요',
      author: { nickname: '길동', profile_image_url: null },
      transport_type: 'OWNED_CAR',
      distance_m: 1100,
      current_count: 3,
      capacity: 4,
      departure_at: '2026-09-22T11:00:00.000Z',
      is_expired: false,
    },
  },
  {
    pinVariant: 'accompany',
    position: { lat: 37.3945, lng: 127.1112 },
    post: {
      type: 'COMPANION',
      id: 10,
      title: '판교역 → 강남역',
      author: { nickname: '우림', profile_image_url: null },
      transport_type: 'TAXI',
      distance_m: 320,
      current_count: 2,
      capacity: 4,
      departure_at: '2026-09-05T08:30:00.000Z',
      is_expired: false,
    },
  },
  {
    pinVariant: 'community',
    position: { lat: 37.5123, lng: 127.041 },
    post: {
      type: 'COMMUNITY',
      id: 88,
      title: '판교역 근처 카페 추천',
      author: { nickname: '루디', profile_image_url: null },
      distance_m: 540,
      comment_count: 3,
      created_at: '2026-09-03T10:00:00.000Z',
    },
  },
];

const mockPostDetails: Record<number, PostDetail> = {
  1: {
    type: 'COMPANION',
    id: 1,
    title: '판교역까지 카풀할 분 찾아요',
    description: '서울역에서 판교역까지 함께 이동할 분을 구해요.',
    author: { nickname: '모여타', profile_image_url: null },
    transport_type: 'OWNED_CAR',
    distance_m: 320,
    current_count: 2,
    capacity: 4,
    departure_at: '2026-09-22T09:40:00.000Z',
    departure_location: '서울역 10번 출구',
    destination: '판교역 1번 출구',
    is_expired: false,
    participants: [
      { id: 1, nickname: '모여타', profile_image_url: null },
      { id: 2, nickname: '타요', profile_image_url: null },
    ],
  },
  2: {
    type: 'COMPANION',
    id: 2,
    title: '신논현까지 함께 이동해요',
    description: '신논현역까지 지하철로 같이 이동해요.',
    author: { nickname: '타요', profile_image_url: null },
    transport_type: 'SUBWAY',
    distance_m: 540,
    current_count: 1,
    capacity: 4,
    departure_at: '2026-09-22T10:20:00.000Z',
    departure_location: '서울역 12번 출구',
    destination: '신논현역 3번 출구',
    is_expired: false,
    participants: [{ id: 3, nickname: '타요', profile_image_url: null }],
  },
  3: {
    type: 'COMMUNITY',
    id: 3,
    title: '판교역 근처 카페 추천',
    description: '조용히 작업하기 좋은 카페를 찾고 있어요.',
    author: { nickname: '루디', profile_image_url: null },
    distance_m: 780,
    comment_count: 3,
    created_at: '2026-09-22T08:00:00.000Z',
    comments: [
      {
        id: 1,
        author: { nickname: '하루', profile_image_url: null },
        content: '판교역 근처에 좋은 카페가 많아요.',
      },
    ],
  },
  4: {
    type: 'COMMUNITY',
    id: 4,
    title: '오늘 저녁 같이 먹어요',
    description: '오늘 저녁을 함께 먹을 분을 찾습니다.',
    author: { nickname: '하루', profile_image_url: null },
    distance_m: 920,
    comment_count: 5,
    created_at: '2026-09-22T08:30:00.000Z',
    comments: [
      {
        id: 2,
        author: { nickname: '루디', profile_image_url: null },
        content: '저도 함께하고 싶어요.',
      },
    ],
  },
  5: {
    type: 'COMPANION',
    id: 5,
    title: '퇴근길 카풀 동행 구해요',
    description: '퇴근 시간에 함께 이동할 분을 구해요.',
    author: { nickname: '길동', profile_image_url: null },
    transport_type: 'OWNED_CAR',
    distance_m: 1100,
    current_count: 3,
    capacity: 4,
    departure_at: '2026-09-22T11:00:00.000Z',
    departure_location: '판교역 2번 출구',
    destination: '강남역 10번 출구',
    is_expired: false,
    participants: [
      { id: 4, nickname: '길동', profile_image_url: null },
      { id: 5, nickname: '모여타', profile_image_url: null },
      { id: 6, nickname: '타요', profile_image_url: null },
    ],
  },
  10: {
    type: 'COMPANION',
    id: 10,
    title: '판교역 → 강남역',
    description: '택시 같이 타실 분 구해요',
    author: { nickname: '우림', profile_image_url: null },
    transport_type: 'TAXI',
    distance_m: 320,
    current_count: 2,
    capacity: 4,
    departure_at: '2026-09-05T08:30:00.000Z',
    departure_location: '판교역',
    destination: '강남역',
    is_expired: false,
    participants: [
      { id: 10, nickname: '우림', profile_image_url: null },
      { id: 11, nickname: '루디', profile_image_url: null },
    ],
  },
  88: {
    type: 'COMMUNITY',
    id: 88,
    title: '판교역 근처 카페 추천',
    description: '조용히 작업하기 좋은 카페가 있을까요?',
    author: { nickname: '루디', profile_image_url: null },
    distance_m: 540,
    comment_count: 3,
    created_at: '2026-09-03T10:00:00.000Z',
    comments: [],
  },
};

function getMapPinMarkerId(pin: MapPin) {
  return `${pin.type}-${pin.id}`;
}

function getMapPinMarkerVariant(pin: MapPin): MapPinMarkerVariant {
  return pin.type === 'COMPANION' ? 'accompany' : 'community';
}

type SelectedPost = PositionedPost & {
  detail: PostDetail;
};

function PostDetailContent({ post }: { post: PostDetail }) {
  if (post.type === 'COMPANION') {
    return <CompanionPostDetail post={post} />;
  }

  return <CommunityPostDetail post={post} />;
}

export function HomePage() {
  const mapRef = useRef<MapRef>(null);
  const [selectedPost, setSelectedPost] = useState<SelectedPost | null>(null);
  const [selectedMapPinId, setSelectedMapPinId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<MapCoordinate | null>(null);
  const [mapViewport, setMapViewport] = useState<MapViewport | null>(null);
  const [isLocationReady, setIsLocationReady] = useState(false);
  const [activeSnapPoint, setActiveSnapPoint] = useState<BottomSheetSnapPoint>('110px');
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [locationError, setLocationError] = useState<MapLocationError | null>(null);

  const mapPinsQuery = useMapPinsQuery(mapViewport, isLocationReady);
  const mapPins = useMemo(() => mapPinsQuery.data?.data.items ?? [], [mapPinsQuery.data]);
  const nearbyPostsQuery = useNearbyPostsQuery(userLocation, mapViewport);
  const posts = useMemo(() => nearbyPostsQuery.data?.data.items ?? [], [nearbyPostsQuery.data]);
  const mapMarkers = useMemo(
    () =>
      mapPins.map((pin) => ({
        id: getMapPinMarkerId(pin),
        image: getMapPinMarkerImage(getMapPinMarkerVariant(pin)),
        isSelected: selectedMapPinId === getMapPinMarkerId(pin),
        position: { lat: pin.lat, lng: pin.lng },
        title: `${pin.type === 'COMPANION' ? '동행모집' : '커뮤니티'} 게시글 ${pin.id}`,
      })),
    [mapPins, selectedMapPinId],
  );

  const handleMarkerClick = useCallback(
    (marker: MapMarker) => {
      const mapPinId = String(marker.id);
      const mapPin = mapPins.find((pin) => getMapPinMarkerId(pin) === mapPinId);

      if (mapPin) {
        setSelectedMapPinId(mapPinId);

        const nearbyPost = posts.find((post) => post.id === mapPin.id && post.type === mapPin.type);
        const mockPost = mockPosts.find(
          ({ post }) => post.id === mapPin.id && post.type === mapPin.type,
        );
        const nextPost = nearbyPost ?? mockPost?.post;
        const detail = nextPost ? mockPostDetails[nextPost.id] : undefined;

        if (nextPost && detail) {
          setSelectedPost({
            pinVariant: getMapPinMarkerVariant(mapPin),
            post: nextPost,
            detail,
            position: { lat: mapPin.lat, lng: mapPin.lng },
          });
        }

        return;
      }

      const nextPost = mockPosts.find(({ post }) => post.id === marker.id);

      if (!nextPost) {
        return;
      }

      const detail = mockPostDetails[nextPost.post.id];

      if (!detail) {
        return;
      }

      setSelectedPost({ ...nextPost, detail });
    },
    [mapPins, posts],
  );

  const handleMapViewportChange = useCallback((viewport: MapViewport) => {
    setSelectedMapPinId(null);
    setMapViewport(viewport);
  }, []);

  const handleUserLocationChange = useCallback((coordinate: MapCoordinate) => {
    setUserLocation(coordinate);
    setIsLocationReady(true);
    setMapViewport(null);
  }, []);

  const handleSnapPointChange = useCallback((snapPoint: BottomSheetSnapPoint | null) => {
    if (snapPoint !== null) {
      setActiveSnapPoint(snapPoint);
    }
  }, []);

  const requestCurrentLocation = useCallback(() => {
    mapRef.current?.requestCurrentLocation();
  }, []);

  const handleLocationError = useCallback((error: MapLocationError) => {
    setLocationError(error);
    setIsLocationDialogOpen(true);
  }, []);

  const requestLocationPermission = useCallback(() => {
    mapRef.current?.requestLocationPermission();
  }, []);

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
          className="h-full"
          clusterMarkers
          markerFocusLevel={4}
          markerFocusOffset={{ y: 160 }}
          markers={mapMarkers}
          onMarkerClick={handleMarkerClick}
          onUserLocationChange={handleUserLocationChange}
          onUserLocationError={handleLocationError}
          onViewportChange={handleMapViewportChange}
          ref={mapRef}
          locateOnMount
          showCurrentLocationButton={false}
          showZoomControls={false}
          viewportDebounceMs={300}
        >
          <PostCreateFab
            className="absolute right-4 bottom-[190px] z-30"
            leftSlot={<Icon name="plus" size={24} />}
            type="button"
          >
            글쓰기
          </PostCreateFab>

          <MyLocationButton
            className="absolute right-4 bottom-[134px] z-20"
            onClick={requestCurrentLocation}
          />
        </Map>
      </main>

      <Dialog
        buttons="primarySecondary"
        className="!w-[calc(100%-40px)] !max-w-[353px]"
        description={locationError?.message}
        onOpenChange={setIsLocationDialogOpen}
        open={isLocationDialogOpen}
        primaryButtonProps={{
          onClick:
            locationError?.code === 'permission-denied'
              ? requestLocationPermission
              : requestCurrentLocation,
        }}
        primaryLabel={locationError?.code === 'permission-denied' ? '허용하기' : '재시도하기'}
        secondaryLabel="닫기"
        showCloseButton={false}
        title="현재 위치를 확인할 수 없어요"
      />

      <BottomSheet
        bottomOffset="calc(72px + env(safe-area-inset-bottom, 0px))"
        className="mx-auto w-full max-w-[393px]"
        defaultSnapPoint="110px"
        modal={false}
        onSnapPointChange={handleSnapPointChange}
        open={!selectedPost}
        snapPoint={activeSnapPoint}
        showBackdrop={false}
        snapPoints={['110px', 0.5, 0.7]}
        title="근처 핀 게시글"
        description="가까운 순"
      >
        <PostList items={posts} />
      </BottomSheet>

      {selectedPost ? (
        <BottomModal
          bottomOffset="calc(84px + env(safe-area-inset-bottom, 0px))"
          href={`/posts/${selectedPost.post.id}`}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedPost(null);
              setSelectedMapPinId(null);
            }
          }}
          open
        >
          <PostDetailContent post={selectedPost.detail} />
        </BottomModal>
      ) : null}

      <BottomNav className="!absolute !inset-x-0 !bottom-0" />
    </div>
  );
}
