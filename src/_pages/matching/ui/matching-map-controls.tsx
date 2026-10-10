import type { Ref } from 'react';

import { MatchingFab } from '@/features/matching-entry';
import { MyLocationButton } from '@/shared/ui/map';

export type MatchingMapControlsProps = {
  fabContainerRef?: Ref<HTMLDivElement>;
  isFabOpened: boolean;
  onFabOpenChange: (isOpened: boolean) => void;
  onCarpoolClick: () => void;
  onTaxipotClick: () => void;
  onCurrentLocationClick: () => void;
};

export function MatchingMapControls({
  fabContainerRef,
  isFabOpened,
  onFabOpenChange,
  onCarpoolClick,
  onTaxipotClick,
  onCurrentLocationClick,
}: MatchingMapControlsProps) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto h-dvh w-full max-w-[393px]"
      data-testid="matching-map-controls"
      ref={fabContainerRef}
    >
      <MatchingFab
        className="pointer-events-auto absolute right-[10px] bottom-[calc(72px+env(safe-area-inset-bottom,0px)+190px)]"
        isOpened={isFabOpened}
        onCarpoolClick={onCarpoolClick}
        onOpenChange={onFabOpenChange}
        onTaxipotClick={onTaxipotClick}
      />
      <MyLocationButton
        className="pointer-events-auto absolute right-4 bottom-[calc(72px+env(safe-area-inset-bottom,0px)+134px)]"
        onClick={onCurrentLocationClick}
      />
    </div>
  );
}
