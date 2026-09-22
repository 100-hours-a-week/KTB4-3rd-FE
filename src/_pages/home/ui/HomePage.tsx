'use client';

import { useCallback, useState } from 'react';

import { getMapPinMarkerImage, type MapPinMarkerVariant } from '@/entities/map-pin';
import { PostList, type Post, type PostDetail } from '@/entities/post';
import { CompanionPostDetail, CommunityPostDetail } from '@/features/post-detail';
import { BottomSheet, type BottomSheetSnapPoint } from '@/shared/ui/bottom-sheet';
import { BottomNav } from '@/shared/ui/BottomNav';
import { Avatar } from '@/shared/ui/avatar';
import { BottomModal } from '@/shared/ui/bottom-modal';
import { Fab } from '@/shared/ui/fab';
import { Header } from '@/shared/ui/header';
import { Icon } from '@/shared/ui/icon';
import { Logo } from '@/shared/ui/logo';
import { Map, MyLocationButton, type MapMarker } from '@/shared/ui/map';
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
      transport: 'CAR',
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
      transport: 'SUBWAY',
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
      transport: 'CAR',
      distance_m: 1100,
      current_count: 3,
      capacity: 4,
      departure_at: '2026-09-22T11:00:00.000Z',
      is_expired: false,
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
    transport: 'CAR',
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
    transport: 'SUBWAY',
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
    transport: 'CAR',
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
};

const posts = mockPosts.map(({ post }) => post);
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
  const [selectedPost, setSelectedPost] = useState<SelectedPost | null>(null);
  const [activeSnapPoint, setActiveSnapPoint] = useState<BottomSheetSnapPoint>('110px');
  const mapMarkers = mockPosts.map(({ pinVariant, position, post }) => ({
    id: post.id,
    image: getMapPinMarkerImage(pinVariant),
    isSelected: selectedPost?.post.id === post.id,
    position,
    title: post.title,
  }));

  const handleMarkerClick = useCallback((marker: MapMarker) => {
    const nextPost = mockPosts.find(({ post }) => post.id === marker.id);

    if (!nextPost) {
      return;
    }

    const detail = mockPostDetails[nextPost.post.id];

    if (!detail) {
      return;
    }

    setSelectedPost({ ...nextPost, detail });
  }, []);

  const handleSnapPointChange = useCallback((snapPoint: BottomSheetSnapPoint | null) => {
    if (snapPoint !== null) {
      setActiveSnapPoint(snapPoint);
    }
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
          showCurrentLocationButton={false}
          showZoomControls={false}
        >
          <Fab
            className="absolute right-4 bottom-[190px] z-30"
            leftSlot={<Icon name="plus" size={24} />}
            type="button"
          >
            글쓰기
          </Fab>

          <MyLocationButton className="absolute right-4 bottom-[134px] z-20" />
        </Map>
      </main>

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
