'use client';

import type { ReactNode } from 'react';

import { HeaderUser } from '@/features/header-user';
import type { User } from '@/entities/user';
import { BottomNav } from '@/shared/ui/BottomNav';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Header } from '@/shared/ui/header';
import { Logo } from '@/shared/ui/logo';

import { MatchingMapControls, type MatchingMapControlsProps } from './matching-map-controls';

export type MatchingPageViewProps = MatchingMapControlsProps & {
  map: ReactNode;
  user?: User;
  nearbyCarpools?: ReactNode;
};

export function MatchingPageView({
  map,
  user,
  nearbyCarpools,
  ...mapControlsProps
}: MatchingPageViewProps) {
  return (
    <div className="relative mx-auto h-dvh w-full max-w-[393px] overflow-hidden bg-[var(--color-bg-layer-fill)]">
      <Header
        className="z-30 bg-transparent"
        leftSlot={
          <span className="pt-2 pl-1.5">
            <Logo alt="모여타" size={27} variant="text" />
          </span>
        }
        rightSlot={
          <span className="pt-3 pr-1.5">
            <HeaderUser user={user} />
          </span>
        }
      />

      <main className="relative h-[calc(100dvh-72px-env(safe-area-inset-bottom,0px))] min-h-0">
        {map}
        <MatchingMapControls {...mapControlsProps} />
      </main>

      <BottomSheet
        bottomOffset="calc(72px + env(safe-area-inset-bottom, 0px))"
        className="mx-auto w-full max-w-[393px]"
        defaultSnapPoint="110px"
        minHeight="calc(100dvh - 72px - env(safe-area-inset-bottom, 0px))"
        modal={false}
        open
        showBackdrop={false}
        snapPoints={['110px', 0.5, 0.7]}
        title="근처 카풀 게시글"
        description="가까운 순"
      >
        {nearbyCarpools ?? null}
      </BottomSheet>

      <BottomNav className="!fixed !right-auto !bottom-0 !left-1/2 !w-full !max-w-[393px] !-translate-x-1/2" />
    </div>
  );
}
