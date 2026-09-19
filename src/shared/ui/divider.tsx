import type { ComponentPropsWithoutRef, CSSProperties, ElementType } from 'react';

import { cn } from '@/shared/lib/cn';

export const dividerColors = {
  'neutral-muted': 'var(--color-stroke-neutral-muted)',
  'neutral-subtle': 'var(--color-stroke-neutral-subtle)',
} as const;

export type DividerColor = keyof typeof dividerColors;
export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerElement = 'hr' | 'div' | 'li';
export type DividerThickness = number | string;

type DividerStyle = CSSProperties & {
  '--divider-color'?: string;
  '--divider-thickness'?: string;
};

type DividerOwnProps = {
  className?: string;
  color?: DividerColor | (string & {});
  inset?: boolean;
  orientation?: DividerOrientation;
  thickness?: DividerThickness;
};

export type DividerProps<T extends DividerElement = 'hr'> = DividerOwnProps &
  Omit<ComponentPropsWithoutRef<T>, keyof DividerOwnProps | 'as'> & {
    as?: T;
  };

function resolveColor(color: DividerProps['color']) {
  return color && color in dividerColors
    ? dividerColors[color as DividerColor]
    : (color ?? dividerColors['neutral-muted']);
}

function resolveThickness(thickness: DividerThickness) {
  return typeof thickness === 'number' ? `${thickness}px` : thickness;
}

export function Divider<T extends DividerElement = 'hr'>({
  as,
  className,
  color = 'neutral-muted',
  inset = false,
  orientation = 'horizontal',
  style,
  thickness = 1,
  ...props
}: DividerProps<T>) {
  const Component = (as ?? 'hr') as ElementType;
  const isHorizontal = orientation === 'horizontal';
  const resolvedStyle: DividerStyle = {
    '--divider-color': resolveColor(color),
    '--divider-thickness': resolveThickness(thickness),
    ...style,
  };

  return (
    <Component
      {...props}
      aria-orientation={isHorizontal ? undefined : 'vertical'}
      className={cn(
        'm-0 shrink-0 border-0 bg-[var(--divider-color)]',
        isHorizontal
          ? 'h-[var(--divider-thickness)] w-full'
          : 'h-full w-[var(--divider-thickness)]',
        inset &&
          (isHorizontal
            ? 'mx-[var(--spacing-x-global-gutter)] w-auto'
            : 'my-[var(--spacing-x-global-gutter)] h-auto'),
        className,
      )}
      style={resolvedStyle}
    />
  );
}
