import type { ButtonHTMLAttributes } from 'react';
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

export type CongestionPinProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  isSelected?: boolean;
  selectedMessage?: string;
  variant?: CongestionPinVariant;
};

const CONGESTION_PIN_VECTOR_HEIGHT = 32.5826;
const CONGESTION_PIN_WIDTH = 34;
const CONGESTION_PIN_SELECTED_HEIGHT = 70.9258;
const CONGESTION_PIN_SELECTED_WIDTH = 119;

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
  const {
    isSelected = false,
    'aria-label': ariaLabel = `${congestionPinLabels[variant]} 혼잡도 핀`,
    selectedMessage = '퇴근길 인파로 지연이\n5분정도 있어요',
    ...buttonProps
  } = props;

  return (
    <button
      {...buttonProps}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      className={cn(
        'relative block h-[34px] w-[34px] shrink-0 origin-bottom overflow-visible border-0 bg-transparent p-0',
        className,
      )}
      data-congestion-pin={variant}
      data-congestion-pin-state={isSelected ? 'selected' : 'default'}
      type="button"
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-0 h-[34px] w-[34px] transition-opacity duration-200 ease-out motion-reduce:transition-none',
          isSelected ? 'opacity-0' : 'opacity-100',
        )}
      >
        <Image
          alt=""
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

      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute bottom-0 left-1/2 -ml-[59.5px] h-[73px] w-[119px] origin-bottom transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none',
          isSelected
            ? 'scale-x-100 scale-y-100 opacity-100'
            : 'scale-x-[0.286] scale-y-[0.466] opacity-0',
        )}
      >
        <Image
          alt=""
          className="absolute top-0 left-0 block max-w-none"
          height={CONGESTION_PIN_SELECTED_HEIGHT}
          src="/map-pins/congestion/delayed-selected.svg"
          unoptimized
          width={CONGESTION_PIN_SELECTED_WIDTH}
        />
        <Text
          as="span"
          className={cn(
            'absolute top-4 left-[10px] text-left whitespace-pre-line text-black transition-opacity duration-150 ease-out motion-reduce:transition-none',
            isSelected ? 'opacity-100 delay-75' : 'opacity-0',
          )}
          variant="t1Regular"
        >
          {selectedMessage}
        </Text>
      </span>
    </button>
  );
}
