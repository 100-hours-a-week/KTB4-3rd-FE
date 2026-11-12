import Image from 'next/image';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';
import type { MapMarkerImage } from '@/shared/ui/map';

const CARPOOL_MARKER_SRC = '/map-pins/carpool-marker.png';
const carpoolMarkerImage: MapMarkerImage = {
  src: CARPOOL_MARKER_SRC,
  width: 54,
  height: 54,
  offset: { x: 27, y: 54 },
};

export function getCarpoolPinMarkerImage(): MapMarkerImage {
  return carpoolMarkerImage;
}

export type CarpoolPinProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  isSelected?: boolean;
};

export function CarpoolPin({
  isSelected = false,
  className,
  'aria-label': label = '카풀 게시글',
  ...props
}: CarpoolPinProps) {
  return (
    <button
      {...props}
      aria-label={label}
      aria-pressed={isSelected}
      className={cn(
        'relative block size-[54px] shrink-0 origin-bottom bg-transparent transition-[transform,filter] duration-75 ease-out active:brightness-95 focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)] disabled:pointer-events-none',
        isSelected && 'z-10 scale-[1.15]',
        className,
      )}
      data-map-pin="carpool"
      type="button"
    >
      <Image alt="" aria-hidden height={54} src={CARPOOL_MARKER_SRC} unoptimized width={54} />
    </button>
  );
}
