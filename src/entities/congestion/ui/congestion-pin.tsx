import type { ButtonHTMLAttributes } from 'react';
import Image from 'next/image';

import { cn } from '@/shared/lib/cn';
import type { MapMarkerImage } from '@/shared/ui/map';
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
const CONGESTION_PIN_SELECTED_WIDTH = 119;
const CONGESTION_PIN_SELECTED_CENTER_X = CONGESTION_PIN_SELECTED_WIDTH / 2;
const CONGESTION_PIN_SELECTED_TEXT_MAX_CHARS = 9;
const CONGESTION_PIN_SELECTED_TEXT_LINE_HEIGHT = 15;
const CONGESTION_PIN_SELECTED_BODY_BASE_HEIGHT = 30.7229;
const CONGESTION_PIN_SELECTED_TAIL_HEIGHT = 10.2029;
const CONGESTION_PIN_SELECTED_TAIL_POINT_OFFSET = 8.9766;
export const CONGESTION_PIN_ANIMATION_DURATION_MS = 150;
const CONGESTION_PIN_ANIMATION_DURATION = `${CONGESTION_PIN_ANIMATION_DURATION_MS}ms`;
const CONGESTION_PIN_TEXT_ANIMATION_DURATION = '75ms';
const CONGESTION_PIN_TEXT_ANIMATION_DELAY = '75ms';
const CONGESTION_PIN_TEXT_COLLAPSE_DURATION = '50ms';
const CONGESTION_PIN_TEXT_COLLAPSE_DELAY = '0ms';
const CONGESTION_PIN_SELECTED_BODY_RADIUS = 15;
const CONGESTION_PIN_DEFAULT_TRANSLATE_X =
  (CONGESTION_PIN_SELECTED_WIDTH - CONGESTION_PIN_WIDTH) / 2;
const CONGESTION_PIN_ANIMATION_ORIGIN_X = CONGESTION_PIN_SELECTED_WIDTH / 2;

const congestionPinSources: Record<CongestionPinVariant, string> = {
  accident: '/map-pins/congestion/accident.svg',
  available: '/map-pins/congestion/available.svg',
  busy: '/map-pins/congestion/busy.svg',
  congested: '/map-pins/congestion/congested.svg',
  delayed: '/map-pins/congestion/delayed.svg',
};

const congestionPinDefaultPath =
  'M4.25 0C3.12283 0 2.04183 0.447767 1.2448 1.2448C0.447767 2.04183 0 3.12283 0 4.25V21.25C0 22.3772 0.447767 23.4582 1.2448 24.2552C2.04183 25.0522 3.12283 25.5 4.25 25.5H9.5625C9.8924 25.5 10.2178 25.5768 10.5128 25.7243C10.8079 25.8719 11.0646 26.0861 11.2625 26.35L15.3 31.7326C15.4979 31.9965 15.7546 32.2108 16.0497 32.3583C16.3447 32.5058 16.6701 32.5826 17 32.5826C17.3299 32.5826 17.6553 32.5058 17.9503 32.3583C18.2454 32.2108 18.5021 31.9965 18.7 31.7326L22.7375 26.35C22.9354 26.0861 23.1921 25.8719 23.4872 25.7243C23.7822 25.5768 24.1076 25.5 24.4375 25.5H29.75C30.8772 25.5 31.9582 25.0522 32.7552 24.2552C33.5522 23.4582 34 22.3772 34 21.25V4.25C34 3.12283 33.5522 2.04183 32.7552 1.2448C31.9582 0.447767 30.8772 0 29.75 0H4.25Z';

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

const congestionPinBackgroundColors: Record<CongestionPinVariant, string> = {
  accident: '#1A1C20',
  available: '#0099FF',
  busy: '#FA342C',
  congested: '#FBDC65',
  delayed: '#FA9D2C',
};

const congestionPinTextColorValues: Record<CongestionPinVariant, string> = {
  accident: '#FFFFFF',
  available: '#FFFFFF',
  busy: '#FFFFFF',
  congested: '#111111',
  delayed: '#111111',
};

function escapeSvgText(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      "'": '&apos;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
    };

    return entities[character] ?? character;
  });
}

function wrapSelectedTextLine(line: string) {
  const words = line.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [''];
  }

  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    if (word.length > CONGESTION_PIN_SELECTED_TEXT_MAX_CHARS) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = '';
      }

      for (let index = 0; index < word.length; index += CONGESTION_PIN_SELECTED_TEXT_MAX_CHARS) {
        lines.push(word.slice(index, index + CONGESTION_PIN_SELECTED_TEXT_MAX_CHARS));
      }

      return;
    }

    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= CONGESTION_PIN_SELECTED_TEXT_MAX_CHARS) {
      currentLine = nextLine;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function wrapSelectedText(value: string) {
  return value.split('\n').flatMap(wrapSelectedTextLine);
}

type CongestionPinLayout = {
  bodyHeight: number;
  markerHeight: number;
  textLines: string[];
};

function getCongestionPinLayout(selectedMessage: string): CongestionPinLayout {
  const textLines = wrapSelectedText(selectedMessage);
  const bodyHeight =
    CONGESTION_PIN_SELECTED_BODY_BASE_HEIGHT +
    textLines.length * CONGESTION_PIN_SELECTED_TEXT_LINE_HEIGHT;

  return {
    bodyHeight,
    markerHeight: bodyHeight + CONGESTION_PIN_SELECTED_TAIL_HEIGHT,
    textLines,
  };
}

function getDefaultPinTranslateY(markerHeight: number) {
  return markerHeight - CONGESTION_PIN_VECTOR_HEIGHT;
}

function getCongestionPinSelectedTailPath(bodyHeight: number) {
  const tailPointY = bodyHeight + CONGESTION_PIN_SELECTED_TAIL_POINT_OFFSET;
  const tailControlY = bodyHeight + CONGESTION_PIN_SELECTED_TAIL_HEIGHT;

  return `M52.1986 ${bodyHeight}H71.0274L62.4195 ${tailPointY}C61.2209 ${tailControlY} 58.7791 ${tailControlY} 57.5805 ${tailPointY}L52.1986 ${bodyHeight}Z`;
}

type CongestionPinMarkerAnimation = 'expand' | 'collapse';

function createSelectedPinText(variant: CongestionPinVariant, textLines: readonly string[]) {
  const textContent = textLines
    .map(
      (line, index) =>
        `<tspan x="${CONGESTION_PIN_SELECTED_CENTER_X}" dy="${index === 0 ? 0 : CONGESTION_PIN_SELECTED_TEXT_LINE_HEIGHT}">${escapeSvgText(line)}</tspan>`,
    )
    .join('');

  return `<text x="${CONGESTION_PIN_SELECTED_CENTER_X}" y="28" text-anchor="middle" fill="${congestionPinTextColorValues[variant]}" font-family="Pretendard, Arial, sans-serif" font-size="11" font-weight="400">${textContent}</text>`;
}

function createSelectedPinContent(variant: CongestionPinVariant, layout: CongestionPinLayout) {
  return `<rect x="0" y="0" width="${CONGESTION_PIN_SELECTED_WIDTH}" height="${layout.bodyHeight}" rx="${CONGESTION_PIN_SELECTED_BODY_RADIUS}" ry="${CONGESTION_PIN_SELECTED_BODY_RADIUS}" fill="${congestionPinBackgroundColors[variant]}"/><path d="${getCongestionPinSelectedTailPath(layout.bodyHeight)}" fill="${congestionPinBackgroundColors[variant]}"/>${createSelectedPinText(variant, layout.textLines)}`;
}

function createDefaultPinContent(variant: CongestionPinVariant) {
  return `<path d="${congestionPinDefaultPath}" fill="${congestionPinBackgroundColors[variant]}"/><text x="6" y="18" fill="${congestionPinTextColorValues[variant]}" font-family="Pretendard, Arial, sans-serif" font-size="11" font-weight="400">${escapeSvgText(congestionPinLabels[variant])}</text>`;
}

function createSelectedPinSource(
  variant: CongestionPinVariant,
  selectedMessage: string,
  animation?: CongestionPinMarkerAnimation,
  animationKey?: number,
) {
  const layout = getCongestionPinLayout(selectedMessage);
  const defaultTranslateY = getDefaultPinTranslateY(layout.markerHeight);
  const animationOriginY = layout.markerHeight;
  const selectedTailPath = getCongestionPinSelectedTailPath(layout.bodyHeight);
  const selectedPinContent = createSelectedPinContent(variant, layout);
  const animatedContent =
    animation === 'expand'
      ? `<style>@keyframes congestion-pin-expand{from{transform:scale(0.286,0.466)}to{transform:scale(1,1)}}@keyframes congestion-pin-text-expand{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}.congestion-pin-expand{animation:congestion-pin-expand ${CONGESTION_PIN_ANIMATION_DURATION} cubic-bezier(0.22,2.1,0.36,1) forwards;transform-origin:0 0}.congestion-pin-text-expand{animation:congestion-pin-text-expand ${CONGESTION_PIN_TEXT_ANIMATION_DURATION} ease-out ${CONGESTION_PIN_TEXT_ANIMATION_DELAY} both;transform-origin:0 0}</style><rect class="congestion-pin-body" x="${CONGESTION_PIN_DEFAULT_TRANSLATE_X}" y="${defaultTranslateY}" width="${CONGESTION_PIN_WIDTH}" height="${CONGESTION_PIN_VECTOR_HEIGHT}" rx="${CONGESTION_PIN_SELECTED_BODY_RADIUS}" ry="${CONGESTION_PIN_SELECTED_BODY_RADIUS}" fill="${congestionPinBackgroundColors[variant]}"><animate attributeName="x" from="${CONGESTION_PIN_DEFAULT_TRANSLATE_X}" to="0" dur="${CONGESTION_PIN_ANIMATION_DURATION}" calcMode="spline" keySplines="0.22 0 0.36 1" fill="freeze"/><animate attributeName="y" from="${defaultTranslateY}" to="0" dur="${CONGESTION_PIN_ANIMATION_DURATION}" calcMode="spline" keySplines="0.22 0 0.36 1" fill="freeze"/><animate attributeName="width" from="${CONGESTION_PIN_WIDTH}" to="${CONGESTION_PIN_SELECTED_WIDTH}" dur="${CONGESTION_PIN_ANIMATION_DURATION}" calcMode="spline" keySplines="0.22 0 0.36 1" fill="freeze"/><animate attributeName="height" from="${CONGESTION_PIN_VECTOR_HEIGHT}" to="${layout.bodyHeight}" dur="${CONGESTION_PIN_ANIMATION_DURATION}" calcMode="spline" keySplines="0.22 0 0.36 1" fill="freeze"/></rect><g transform="translate(${CONGESTION_PIN_ANIMATION_ORIGIN_X} ${animationOriginY})"><g class="congestion-pin-expand"><g transform="translate(-${CONGESTION_PIN_ANIMATION_ORIGIN_X} -${animationOriginY})"><path d="${selectedTailPath}" fill="${congestionPinBackgroundColors[variant]}"/></g></g></g><g class="congestion-pin-text-expand">${createSelectedPinText(variant, layout.textLines)}</g>`
      : selectedPinContent;
  const animationKeyAttribute = animation ? ` data-animation-key="${animationKey ?? 0}"` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CONGESTION_PIN_SELECTED_WIDTH}" height="${layout.markerHeight}" viewBox="0 0 ${CONGESTION_PIN_SELECTED_WIDTH} ${layout.markerHeight}" overflow="visible"${animationKeyAttribute}>${animatedContent}</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createCollapsingPinSource(
  variant: CongestionPinVariant,
  selectedMessage: string,
  animationKey?: number,
) {
  const layout = getCongestionPinLayout(selectedMessage);
  const defaultTranslateY = getDefaultPinTranslateY(layout.markerHeight);
  const animationOriginY = layout.markerHeight;
  const selectedTailPath = getCongestionPinSelectedTailPath(layout.bodyHeight);
  const defaultPinContent = createDefaultPinContent(variant);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CONGESTION_PIN_SELECTED_WIDTH}" height="${layout.markerHeight}" viewBox="0 0 ${CONGESTION_PIN_SELECTED_WIDTH} ${layout.markerHeight}" overflow="visible" data-animation-key="${animationKey ?? 0}"><style>@keyframes congestion-pin-collapse{from{opacity:1;transform:scale(1,1)}to{opacity:0;transform:scale(0.286,0.466)}}@keyframes congestion-pin-text-collapse{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(3px)}}.congestion-pin-collapse{animation:congestion-pin-collapse ${CONGESTION_PIN_ANIMATION_DURATION} cubic-bezier(0.22,2.1,0.36,1) forwards;transform-origin:0 0}.congestion-pin-text-collapse{animation:congestion-pin-text-collapse ${CONGESTION_PIN_TEXT_COLLAPSE_DURATION} ease-in ${CONGESTION_PIN_TEXT_COLLAPSE_DELAY} both;transform-origin:0 0}</style><rect class="congestion-pin-body" x="0" y="0" width="${CONGESTION_PIN_SELECTED_WIDTH}" height="${layout.bodyHeight}" rx="${CONGESTION_PIN_SELECTED_BODY_RADIUS}" ry="${CONGESTION_PIN_SELECTED_BODY_RADIUS}" fill="${congestionPinBackgroundColors[variant]}"><animate attributeName="x" from="0" to="${CONGESTION_PIN_DEFAULT_TRANSLATE_X}" dur="${CONGESTION_PIN_ANIMATION_DURATION}" calcMode="spline" keySplines="0.22 0 0.36 1" fill="freeze"/><animate attributeName="y" from="0" to="${defaultTranslateY}" dur="${CONGESTION_PIN_ANIMATION_DURATION}" calcMode="spline" keySplines="0.22 0 0.36 1" fill="freeze"/><animate attributeName="width" from="${CONGESTION_PIN_SELECTED_WIDTH}" to="${CONGESTION_PIN_WIDTH}" dur="${CONGESTION_PIN_ANIMATION_DURATION}" calcMode="spline" keySplines="0.22 0 0.36 1" fill="freeze"/><animate attributeName="height" from="${layout.bodyHeight}" to="${CONGESTION_PIN_VECTOR_HEIGHT}" dur="${CONGESTION_PIN_ANIMATION_DURATION}" calcMode="spline" keySplines="0.22 0 0.36 1" fill="freeze"/></rect><g transform="translate(${CONGESTION_PIN_ANIMATION_ORIGIN_X} ${animationOriginY})"><g class="congestion-pin-collapse"><g transform="translate(-${CONGESTION_PIN_ANIMATION_ORIGIN_X} -${animationOriginY})"><path d="${selectedTailPath}" fill="${congestionPinBackgroundColors[variant]}"/></g></g></g><g class="congestion-pin-text-collapse">${createSelectedPinText(variant, layout.textLines)}</g><g transform="translate(${CONGESTION_PIN_DEFAULT_TRANSLATE_X} ${defaultTranslateY})">${defaultPinContent}</g></svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createDefaultPinSource(variant: CongestionPinVariant, markerHeight: number) {
  const defaultTranslateY = getDefaultPinTranslateY(markerHeight);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CONGESTION_PIN_SELECTED_WIDTH}" height="${markerHeight}" viewBox="0 0 ${CONGESTION_PIN_SELECTED_WIDTH} ${markerHeight}" overflow="visible"><g transform="translate(${CONGESTION_PIN_DEFAULT_TRANSLATE_X} ${defaultTranslateY})">${createDefaultPinContent(variant)}</g></svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function getCongestionPinMarkerImage(
  variant: CongestionPinVariant,
  {
    animation,
    animationKey,
    isSelected = false,
    selectedMessage = '퇴근길 인파로 지연이\n5분정도 있어요',
  }: {
    animation?: CongestionPinMarkerAnimation;
    animationKey?: number;
    isSelected?: boolean;
    selectedMessage?: string;
  } = {},
): MapMarkerImage {
  const layout = getCongestionPinLayout(selectedMessage);

  if (animation === 'collapse') {
    return {
      height: layout.markerHeight,
      offset: {
        x: CONGESTION_PIN_SELECTED_WIDTH / 2,
        y: layout.markerHeight,
      },
      src: createCollapsingPinSource(variant, selectedMessage, animationKey),
      width: CONGESTION_PIN_SELECTED_WIDTH,
    };
  }

  if (isSelected) {
    return {
      height: layout.markerHeight,
      offset: {
        x: CONGESTION_PIN_SELECTED_WIDTH / 2,
        y: layout.markerHeight,
      },
      src: createSelectedPinSource(variant, selectedMessage, animation, animationKey),
      width: CONGESTION_PIN_SELECTED_WIDTH,
    };
  }

  return {
    height: layout.markerHeight,
    offset: {
      x: CONGESTION_PIN_SELECTED_WIDTH / 2,
      y: layout.markerHeight,
    },
    src: createDefaultPinSource(variant, layout.markerHeight),
    width: CONGESTION_PIN_SELECTED_WIDTH,
  };
}

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
          'absolute inset-0 h-[34px] w-[34px]',
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
        className="pointer-events-none absolute bottom-0 left-1/2 -ml-[59.5px] h-[73px] w-[119px]"
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute rounded-[15px] transition-[left,top,width,height,opacity] duration-150 ease-[cubic-bezier(0.22,2.1,0.36,1)] motion-reduce:transition-none',
            isSelected
              ? 'top-0 left-0 h-[61px] w-[119px] opacity-100'
              : 'top-[38.3432px] left-[42.5px] h-[32.5826px] w-[34px] opacity-0',
          )}
          data-congestion-pin-selected-background={variant}
          style={{ backgroundColor: congestionPinBackgroundColors[variant] }}
        />
        <span
          aria-hidden="true"
          className={cn(
            'absolute bottom-0 left-0 h-[73px] w-[119px] origin-bottom transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.22,2.1,0.36,1)] motion-reduce:transition-none',
            isSelected
              ? 'scale-x-100 scale-y-100 opacity-100'
              : 'scale-x-[0.286] scale-y-[0.466] opacity-0',
          )}
        >
          <span
            aria-hidden="true"
            className="absolute top-[53px] left-1/2 h-5 w-5 -translate-x-1/2 [clip-path:polygon(0_0,100%_0,50%_100%)]"
            style={{ backgroundColor: congestionPinBackgroundColors[variant] }}
          />
        </span>
        <Text
          as="span"
          className={cn(
            'absolute top-0 left-0 z-10 box-border block h-[61px] w-[119px] px-[10px] text-center break-words whitespace-pre-line transition-[opacity,transform] motion-reduce:transition-none',
            isSelected
              ? 'translate-y-0 opacity-100 duration-75 delay-75 ease-out'
              : 'translate-y-1 opacity-0 duration-[50ms] delay-0 ease-in',
          )}
          color={congestionPinTextColors[variant]}
          variant="t1Regular"
        >
          {selectedMessage}
        </Text>
      </span>
    </button>
  );
}
