import {
  Crosshair,
  Info,
  LogOut,
  MessageSquare,
  MessageSquareWarning,
  UserRoundX,
  type LucideProps,
} from 'lucide-react';
import type { ComponentType, CSSProperties } from 'react';

import { cn } from '@/shared/lib/cn';

const DEFAULT_ICON_SIZE = 24;

type IconDefinition =
  | {
      type: 'mask';
      source: string;
    }
  | {
      type: 'lucide';
      component: ComponentType<LucideProps>;
    };

const iconRegistry = {
  camera: { type: 'mask', source: '/icons/seed/icon_camera_line.svg' },
  checkmarkCircle: {
    type: 'mask',
    source: '/icons/seed/icon_checkmark_circle_fill.svg',
  },
  chevronDown: { type: 'mask', source: '/icons/seed/icon_chevron_down_line.svg' },
  chevronLeft: { type: 'mask', source: '/icons/seed/icon_chevron_left_line.svg' },
  chevronRight: { type: 'mask', source: '/icons/seed/icon_chevron_right_line.svg' },
  chevronUp: { type: 'mask', source: '/icons/seed/icon_chevron_up_line.svg' },
  minus: { type: 'mask', source: '/icons/seed/icon_minus_line.svg' },
  plus: { type: 'mask', source: '/icons/seed/icon_plus_line.svg' },
  xmark: { type: 'mask', source: '/icons/seed/icon_xmark_line.svg' },
  arrowUpRight: { type: 'mask', source: '/icons/seed/icon_arrow_up_right_line.svg' },
  chattingSend: { type: 'mask', source: '/icons/seed/icon_chatting_send_regular.svg' },
  person2Line: { type: 'mask', source: '/icons/seed/icon_person2_line.svg' },
  person2Fill: { type: 'mask', source: '/icons/seed/icon_person2_fill.svg' },
  houseLine: { type: 'mask', source: '/icons/seed/icon_house_line.svg' },
  houseFill: { type: 'mask', source: '/icons/seed/icon_house_fill.svg' },
  chatbubbleLine: {
    type: 'mask',
    source: '/icons/seed/icon_dot3_horizontal_chatbubble_left_line.svg',
  },
  chatbubbleFill: {
    type: 'mask',
    source: '/icons/seed/icon_dot3_horizontal_chatbubble_left_fill.svg',
  },
  info: { type: 'lucide', component: Info },
  messageSquare: { type: 'lucide', component: MessageSquare },
  crosshair: { type: 'lucide', component: Crosshair },
  logOut: { type: 'lucide', component: LogOut },
  messageSquareWarning: { type: 'lucide', component: MessageSquareWarning },
  userRoundX: { type: 'lucide', component: UserRoundX },
} satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof iconRegistry;

export const iconNames = Object.keys(iconRegistry) as IconName[];

export type IconProps = {
  name: IconName;
  size?: number | string;
  color?: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
  'aria-label'?: string;
};

function getAccessibilityProps({ title, 'aria-label': ariaLabel }: IconProps) {
  const accessibleLabel = ariaLabel ?? title;

  return accessibleLabel
    ? {
        role: 'img' as const,
        'aria-label': accessibleLabel,
      }
    : {
        'aria-hidden': true as const,
      };
}

export function Icon({
  name,
  size = DEFAULT_ICON_SIZE,
  color = 'currentColor',
  className,
  style,
  title,
  'aria-label': ariaLabel,
}: IconProps) {
  const accessibilityProps = getAccessibilityProps({ title, 'aria-label': ariaLabel, name });

  const definition = iconRegistry[name];

  if (definition.type === 'lucide') {
    const LucideIcon = definition.component;

    return (
      <LucideIcon
        {...accessibilityProps}
        aria-label={ariaLabel ?? title}
        className={className}
        color={color}
        size={size}
        style={style}
      />
    );
  }

  const maskStyle: CSSProperties = {
    width: size,
    height: size,
    backgroundColor: color,
    maskImage: `url("${definition.source}")`,
    maskPosition: 'center',
    maskRepeat: 'no-repeat',
    maskSize: 'contain',
    WebkitMaskImage: `url("${definition.source}")`,
    WebkitMaskPosition: 'center',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskSize: 'contain',
    ...style,
  };

  return (
    <span
      {...accessibilityProps}
      className={cn('inline-block shrink-0', className)}
      style={maskStyle}
    />
  );
}
