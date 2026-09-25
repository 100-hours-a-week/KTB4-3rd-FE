'use client';

import { useCallback, useMemo, useState } from 'react';

import { getMapPinMarkerImage, type MapPinMarkerVariant } from '@/entities/map-pin';
import {
  PostList,
  type CommunityPost,
  type CompanionPost,
  type Post,
  type PostDetail,
  type CompanionPostDetail,
  type CommunityPostDetail,
} from '@/entities/post';
import {
  CompanionPostDetail as CompanionPostDetailView,
  CommunityPostDetail as CommunityPostDetailView,
} from '@/features/post-detail';
import {
  type CompanionPostDetailData,
  useCompanionPostDetailQuery,
} from '@/_pages/post-detail/api/companion-posts';
import {
  type CommunityPostDetailData,
  useCommunityPostDetailQuery,
} from '@/_pages/post-detail/api/community-posts';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { BottomModal } from '@/shared/ui/bottom-modal';
import { BottomNav } from '@/shared/ui/BottomNav';
import { Avatar } from '@/shared/ui/avatar';
import { Fab } from '@/shared/ui/fab';
import { Header } from '@/shared/ui/header';
import { Icon } from '@/shared/ui/icon';
import { Logo } from '@/shared/ui/logo';
import { Map, MyLocationButton, type MapMarker } from '@/shared/ui/map';
import type { MapCoordinate } from '@/shared/types/common';
import { Text } from '@/shared/ui/text';

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
];

const posts = mockPosts.map(({ post }) => post);
const mapMarkers = mockPosts.map(({ pinVariant, position, post }) => ({
  id: `${post.type}-${post.id}`,
  image: getMapPinMarkerImage(pinVariant),
  position,
  title: post.title,
}));

function getPostMarkerId(post: Post) {
  return `${post.type}-${post.id}`;
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
): CommunityPostDetail {
  return {
    ...post,
    id: data.id,
    title: data.title,
    description: data.content,
    author: { ...post.author, nickname: data.author.nickname },
    comment_count: data.comment_count,
    created_at: data.created_at,
    comments: [],
  };
}

export function HomePage() {
  const [selectedPost, setSelectedPost] = useState<PositionedPost | null>(null);

  const selectedCompanionId = selectedPost?.post.type === 'COMPANION' ? selectedPost.post.id : null;
  const selectedCommunityId = selectedPost?.post.type === 'COMMUNITY' ? selectedPost.post.id : null;

  const companionDetailQuery = useCompanionPostDetailQuery(selectedCompanionId);
  const communityDetailQuery = useCommunityPostDetailQuery(selectedCommunityId);

  const selectedDetail: PostDetail | null = useMemo(() => {
    if (selectedPost?.post.type === 'COMPANION' && companionDetailQuery.data) {
      return toCompanionPostDetail(selectedPost.post, companionDetailQuery.data.data);
    }

    if (selectedPost?.post.type === 'COMMUNITY' && communityDetailQuery.data) {
      return toCommunityPostDetail(selectedPost.post, communityDetailQuery.data.data);
    }

    return null;
  }, [companionDetailQuery.data, communityDetailQuery.data, selectedPost]);

  const handleMarkerClick = useCallback((marker: MapMarker) => {
    const nextPost = mockPosts.find(({ post }) => getPostMarkerId(post) === String(marker.id));

    if (nextPost) {
      setSelectedPost(nextPost);
    }
  }, []);

  const handlePostClick = useCallback((post: Post) => {
    const nextPost = mockPosts.find(
      ({ post: mockPost }) => getPostMarkerId(mockPost) === getPostMarkerId(post),
    );

    if (nextPost) {
      setSelectedPost(nextPost);
    }
  }, []);

  const handleDetailModalChange = useCallback((open: boolean) => {
    if (!open) {
      setSelectedPost(null);
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
          center={selectedPost?.position}
          className="h-full"
          clusterMarkers
          markerFocusLevel={2}
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
        open={selectedPost === null}
        showBackdrop={false}
        snapPoints={['110px', 0.5, 0.7]}
        title="근처 핀 게시글"
        description="가까운 순"
      >
        <PostList items={posts} onItemClick={handlePostClick} />
      </BottomSheet>

      {selectedPost ? (
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
          {selectedPost.post.type === 'COMPANION' && companionDetailQuery.isError ? (
            <Text className="block p-6" color="fg.critical" variant="t4Regular">
              게시글을 불러오지 못했어요.
            </Text>
          ) : null}
          {selectedPost.post.type === 'COMMUNITY' && communityDetailQuery.isError ? (
            <Text className="block p-6" color="fg.critical" variant="t4Regular">
              게시글을 불러오지 못했어요.
            </Text>
          ) : null}
          {selectedDetail?.type === 'COMPANION' ? (
            <CompanionPostDetailView post={selectedDetail} />
          ) : null}
          {selectedDetail?.type === 'COMMUNITY' ? (
            <CommunityPostDetailView post={selectedDetail} />
          ) : null}
        </BottomModal>
      ) : null}

      <BottomNav className="!fixed !right-auto !bottom-0 !left-1/2 !w-full !max-w-[393px] !-translate-x-1/2" />
    </div>
  );
}
