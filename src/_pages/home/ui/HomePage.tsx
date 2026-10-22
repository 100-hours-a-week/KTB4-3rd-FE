'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useHomePageModel } from '@/_pages/home/model/use-home-page-model';

import { NotificationButton } from '@/entities/notification';
import { selectIsAuthenticated, useAuthStore } from '@/entities/auth';
import { HeaderUser } from '@/features/header-user';
import { PostCreateFab } from '@/features/post-create';
import { PushNotificationPermissionDialog, useNotificationEntry } from '@/features/push-token';
import { BottomNav } from '@/shared/ui/BottomNav';
import { Header } from '@/shared/ui/header';
import { Icon } from '@/shared/ui/icon';
import { Logo } from '@/shared/ui/logo';
import { Map, MyLocationButton } from '@/shared/ui/map';
import { Snackbar } from '@/shared/ui/snackbar';
import { SnackbarViewport } from '@/shared/ui/snackbar-viewport';

import { NearbyPostsSheet } from './NearbyPostsSheet';
import { PostDetailModal } from './PostDetailModal';

export function HomePage() {
  const router = useRouter();
  const notificationEntry = useNotificationEntry({
    onOpenNotifications: () => router.push('/notification'),
  });
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const { currentUser, map, mapControls, mapPinsError, mapRef, nearbyPosts, postDetailModal } =
    useHomePageModel();

  return (
    <>
      <PushNotificationPermissionDialog
        onDefer={notificationEntry.onDefer}
        onEnable={notificationEntry.onEnable}
        onOpenChange={notificationEntry.onPermissionDialogOpenChange}
        open={notificationEntry.isPermissionDialogOpen}
      />
      <div className="relative mx-auto min-h-dvh w-full max-w-[393px] overflow-hidden bg-[var(--color-bg-layer-fill)]">
        <Header
          className="z-30 bg-transparent"
          leftSlot={
            <span className="pt-2 pl-1.5">
              <Logo alt="모여타" size={27} variant="text" />
            </span>
          }
          rightSlot={
            <span className="flex items-center gap-1.5 pt-3 pr-1.5">
              <Link
                aria-label="모여타 소개"
                className="rounded-md px-1.5 py-2 text-xs font-medium text-[var(--color-fg-neutral-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]"
                href="/about"
              >
                소개
              </Link>
              {isAuthenticated ? (
                <NotificationButton onClick={notificationEntry.onNotificationClick} />
              ) : null}
              <HeaderUser user={currentUser} />
            </span>
          }
        />

        <main className="relative h-[calc(100dvh-72px)] min-h-0">
          <Map
            center={map.center}
            className="h-full"
            clusterMarkers
            markerFocusLevel={2}
            markerFocusOffset={{ y: 160 }}
            markers={map.markers}
            onMarkerClick={map.onMarkerClick}
            onUserLocationChange={map.onUserLocationChange}
            onViewportChange={map.onViewportChange}
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
            onClick={mapControls.onCreatePost}
          >
            글쓰기
          </PostCreateFab>

          <MyLocationButton
            className="pointer-events-auto absolute right-4 bottom-[calc(72px+env(safe-area-inset-bottom,0px)+134px)]"
            onClick={mapControls.onCurrentLocation}
          />
        </div>

        <NearbyPostsSheet {...nearbyPosts} />

        <PostDetailModal {...postDetailModal} />

        <BottomNav className="!fixed !right-auto !bottom-0 !left-1/2 !w-full !max-w-[393px] !-translate-x-1/2" />
      </div>
      {typeof document === 'undefined'
        ? null
        : createPortal(
            <>
              {mapPinsError.isError ? (
                <Snackbar
                  actionProps={{
                    children: '다시 시도',
                    onClick: mapPinsError.onRetry,
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
