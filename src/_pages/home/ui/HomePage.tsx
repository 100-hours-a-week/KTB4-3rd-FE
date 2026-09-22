import { getMapPinMarkerImage, type MapPinMarkerVariant } from '@/entities/map-pin';
import { PostList, type Post } from '@/entities/post';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { BottomNav } from '@/shared/ui/BottomNav';
import { Avatar } from '@/shared/ui/avatar';
import { Fab } from '@/shared/ui/fab';
import { Header } from '@/shared/ui/header';
import { Icon } from '@/shared/ui/icon';
import { Logo } from '@/shared/ui/logo';
import { Map, MyLocationButton } from '@/shared/ui/map';
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

const posts = mockPosts.map(({ post }) => post);
const mapMarkers = mockPosts.map(({ pinVariant, position, post }) => ({
  id: post.id,
  image: getMapPinMarkerImage(pinVariant),
  position,
  title: post.title,
}));

export function HomePage() {
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
          markers={mapMarkers}
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
        defaultOpen
        defaultSnapPoint="110px"
        modal={false}
        showBackdrop={false}
        snapPoints={['110px', 0.5, 0.7]}
        title="근처 핀 게시글"
        description="가까운 순"
      >
        <PostList items={posts} />
      </BottomSheet>

      <BottomNav className="!absolute !inset-x-0 !bottom-0" />
    </div>
  );
}
