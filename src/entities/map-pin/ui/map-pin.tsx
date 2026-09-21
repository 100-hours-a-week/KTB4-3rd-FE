import type { HTMLAttributes } from 'react';
import Image from 'next/image';

import { cn } from '@/shared/lib/cn';

const ACCOMPANY_BODY_SRC = '/map-pins/accompany-body.svg';
const ACCOMPANY_CENTER_SRC = '/map-pins/accompany-center.svg';
const COMMUNITY_BODY_SRC = '/map-pins/community-body.svg';
const COMMUNITY_CENTER_SRC = '/map-pins/community-center.svg';
const ROUTE_LINE_SRC = '/map-pins/route-line.svg';

export type MapPinVariant = 'accompany' | 'community' | 'start' | 'destination';
export type MapPinState = 'default' | 'clicked';

type MapPinInteractionEventName =
  | 'onBlur'
  | 'onClick'
  | 'onContextMenu'
  | 'onDoubleClick'
  | 'onFocus'
  | 'onKeyDown'
  | 'onKeyUp'
  | 'onMouseDown'
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'onMouseMove'
  | 'onMouseUp'
  | 'onPointerDown'
  | 'onPointerEnter'
  | 'onPointerLeave'
  | 'onPointerUp'
  | 'onTouchEnd'
  | 'onTouchStart';

type MapPinPresentationProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | MapPinInteractionEventName
>;

type InteractiveMapPinProps = MapPinPresentationProps &
  Pick<HTMLAttributes<HTMLSpanElement>, MapPinInteractionEventName> & {
    /** 동행 모집·커뮤니티 핀만 클릭 이벤트를 받을 수 있습니다. */
    variant: 'accompany' | 'community';
    /** 선택된 핀을 지도 위에서 우선 노출할 때 사용하는 시각 상태입니다. 클릭 순간 피드백은 :active로 처리합니다. */
    state?: MapPinState;
  };

type RouteMapPinProps = MapPinPresentationProps & {
  /** 출발·도착 핀은 위치 표시 전용으로 클릭 이벤트를 받지 않습니다. */
  variant: 'start' | 'destination';
  /** 출발·도착 핀에 표시할 텍스트입니다. 기본값은 각 핀의 고정 라벨입니다. */
  label?: string;
};

export type MapPinProps = InteractiveMapPinProps | RouteMapPinProps;

type MapPinRenderProps = MapPinPresentationProps &
  Pick<HTMLAttributes<HTMLSpanElement>, MapPinInteractionEventName> & {
    variant: MapPinVariant;
    state?: MapPinState;
    label?: string;
  };

const sizeClassNames: Record<MapPinVariant, string> = {
  accompany: 'h-14 w-[54px]',
  community: 'h-14 w-[54px]',
  start: 'h-[38px] w-[38px]',
  destination: 'h-[38px] w-[38px]',
};

const stateClassNames: Record<MapPinState, string> = {
  default: '',
  clicked: 'z-10',
};

function PinImage({
  className,
  height,
  src,
  width,
}: {
  className: string;
  height: number;
  src: string;
  width: number;
}) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={cn('absolute block max-w-none', className)}
      height={height}
      src={src}
      unoptimized
      width={width}
    />
  );
}

function AccompanyPinVisual() {
  return (
    <>
      <PinImage className="inset-0 size-full" height={56} src={ACCOMPANY_BODY_SRC} width={54} />
      <PinImage
        className="top-2 left-[17px] size-5"
        height={20}
        src={ACCOMPANY_CENTER_SRC}
        width={20}
      />
    </>
  );
}

function CommunityPinVisual() {
  return (
    <>
      <PinImage
        className="top-0 left-[7px] h-14 w-10"
        height={56}
        src={COMMUNITY_BODY_SRC}
        width={40}
      />
      <PinImage
        className="top-2 left-[17px] size-5"
        height={20}
        src={COMMUNITY_CENTER_SRC}
        width={20}
      />
    </>
  );
}

function RoutePinVisual({ label }: { label: string }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 h-[25px] w-[38px] bg-[var(--color-bg-neutral-solid)]"
      />
      <span className="absolute top-1 left-[9px] text-[11px] leading-[15px] font-normal whitespace-nowrap text-white">
        {label}
      </span>
      <span className="absolute top-6 left-1/2 flex h-2 w-0 -translate-x-1/2 items-center justify-center">
        <PinImage
          className="static h-px w-[7.39px] rotate-90"
          height={1}
          src={ROUTE_LINE_SRC}
          width={7.39}
        />
      </span>
    </>
  );
}

export function MapPin(props: MapPinProps) {
  const { variant, state = 'default', label, className, ...rest } = props as MapPinRenderProps;
  const accessibilityLabel = rest['aria-label'];
  const accessibilityProps = {
    'aria-hidden': accessibilityLabel ? undefined : (rest['aria-hidden'] ?? true),
    'aria-label': accessibilityLabel,
  };
  const isInteractive = variant === 'accompany' || variant === 'community';

  return (
    <span
      {...rest}
      {...accessibilityProps}
      className={cn(
        'relative block shrink-0',
        sizeClassNames[variant],
        isInteractive && 'transition-[filter] duration-75 ease-out active:brightness-95',
        isInteractive && stateClassNames[state],
        className,
      )}
      data-map-pin={variant}
      data-map-pin-state={isInteractive ? state : undefined}
    >
      {variant === 'accompany' ? <AccompanyPinVisual /> : null}
      {variant === 'community' ? <CommunityPinVisual /> : null}
      {variant === 'start' ? <RoutePinVisual label={label ?? '출발'} /> : null}
      {variant === 'destination' ? <RoutePinVisual label={label ?? '도착'} /> : null}
    </span>
  );
}

export type StandaloneMapPinProps = Omit<InteractiveMapPinProps, 'variant'>;
export type RoutePinProps = Omit<RouteMapPinProps, 'variant'>;

export function AccompanyPin(props: StandaloneMapPinProps) {
  return <MapPin {...props} variant="accompany" />;
}

export function CommunityPin(props: StandaloneMapPinProps) {
  return <MapPin {...props} variant="community" />;
}

export function StartPin(props: RoutePinProps) {
  return <MapPin {...props} variant="start" />;
}

export function DestinationPin(props: RoutePinProps) {
  return <MapPin {...props} variant="destination" />;
}
