import type { HTMLAttributes } from 'react';
import Image from 'next/image';

import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';

export const congestionPinVariants = [
  'busy',
  'congested',
  'available',
  'delayed',
  'accident',
] as const;
export type CongestionPinVariant = (typeof congestionPinVariants)[number];

export type CongestionPinProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  variant?: CongestionPinVariant;
};

const CONGESTION_PIN_VECTOR_HEIGHT = 32.5826;
const CONGESTION_PIN_WIDTH = 34;

const congestionPinSources: Record<CongestionPinVariant, string> = {
  accident: '/map-pins/congestion/accident.svg',
  available: '/map-pins/congestion/available.svg',
  busy: '/map-pins/congestion/busy.svg',
  congested: '/map-pins/congestion/congested.svg',
  delayed: '/map-pins/congestion/delayed.svg',
};

const congestionPinLabels: Record<CongestionPinVariant, string> = {
  accident: '사고',
  available: '여유',
  busy: '붐빔',
  congested: '혼잡',
  delayed: '지연',
};

const congestionPinTextColors: Record<CongestionPinVariant, 'fg.neutral' | 'fg.neutralInverted'> = {
  accident: 'fg.neutralInverted',
  available: 'fg.neutralInverted',
  busy: 'fg.neutralInverted',
  congested: 'fg.neutral',
  delayed: 'fg.neutral',
};

export function CongestionPin({ className, variant = 'busy', ...props }: CongestionPinProps) {
  const ariaLabel = props['aria-label'];

  return (
    <span
      {...props}
      aria-hidden={ariaLabel ? undefined : (props['aria-hidden'] ?? true)}
      className={cn('relative block h-[34px] w-[34px] shrink-0', className)}
      data-congestion-pin={variant}
    >
      <Image
        alt=""
        aria-hidden="true"
        className="absolute top-0 left-0 block max-w-none"
        height={CONGESTION_PIN_VECTOR_HEIGHT}
        src={congestionPinSources[variant]}
        unoptimized
        width={CONGESTION_PIN_WIDTH}
      />
      <Text
        as="span"
        className="absolute top-[5px] left-[6px] whitespace-nowrap"
        color={congestionPinTextColors[variant]}
        variant="t2Regular"
      >
        {congestionPinLabels[variant]}
      </Text>
    </span>
  );
}
