import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export const spacingTokenClassNames = {
  'dimension-x1': 'gap-[var(--dimension-x1)]',
  'dimension-x1_5': 'gap-[var(--dimension-x1_5)]',
  'dimension-x2': 'gap-[var(--dimension-x2)]',
  'dimension-x2_5': 'gap-[var(--dimension-x2_5)]',
  'dimension-x3': 'gap-[var(--dimension-x3)]',
  'dimension-x3_5': 'gap-[var(--dimension-x3_5)]',
  'dimension-x4': 'gap-[var(--dimension-x4)]',
  'dimension-x4_5': 'gap-[var(--dimension-x4_5)]',
  'dimension-x5': 'gap-[var(--dimension-x5)]',
  'dimension-x6': 'gap-[var(--dimension-x6)]',
  'dimension-x7': 'gap-[var(--dimension-x7)]',
  'dimension-x8': 'gap-[var(--dimension-x8)]',
  'dimension-x9': 'gap-[var(--dimension-x9)]',
  'dimension-x10': 'gap-[var(--dimension-x10)]',
  'dimension-x12': 'gap-[var(--dimension-x12)]',
  'dimension-x13': 'gap-[var(--dimension-x13)]',
  'dimension-x14': 'gap-[var(--dimension-x14)]',
  'dimension-x16': 'gap-[var(--dimension-x16)]',
  'spacing-x-between-chips': 'gap-[var(--spacing-x-between-chips)]',
  'spacing-x-global-gutter': 'gap-[var(--spacing-x-global-gutter)]',
  'spacing-y-component-default': 'gap-[var(--spacing-y-component-default)]',
  'spacing-y-screen-bottom': 'gap-[var(--spacing-y-screen-bottom)]',
  'spacing-y-between-text': 'gap-[var(--spacing-y-between-text)]',
} as const;

export type SpacingToken = keyof typeof spacingTokenClassNames;

export const spacingTokenNames = Object.keys(spacingTokenClassNames) as SpacingToken[];

export type StackDirection = 'row' | 'column';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackJustify = 'start' | 'center' | 'end' | 'between';

type StackOwnProps = {
  align?: StackAlign;
  children: ReactNode;
  className?: string;
  direction?: StackDirection;
  gap?: SpacingToken;
  justify?: StackJustify;
  wrap?: boolean;
};

export type StackProps<T extends ElementType = 'div'> = StackOwnProps &
  Omit<ComponentPropsWithoutRef<T>, keyof StackOwnProps | 'as'> & {
    as?: T;
  };

const directionClassNames: Record<StackDirection, string> = {
  row: 'flex-row',
  column: 'flex-col',
};

const alignClassNames: Record<StackAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyClassNames: Record<StackJustify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

export function Stack<T extends ElementType = 'div'>({
  align,
  as,
  children,
  className,
  direction = 'column',
  gap,
  justify,
  wrap = false,
  ...props
}: StackProps<T>) {
  const Component = as ?? 'div';

  return (
    <Component
      {...props}
      className={cn(
        'flex',
        directionClassNames[direction],
        gap ? spacingTokenClassNames[gap] : undefined,
        align ? alignClassNames[align] : undefined,
        justify ? justifyClassNames[justify] : undefined,
        wrap ? 'flex-wrap' : undefined,
        className,
      )}
    >
      {children}
    </Component>
  );
}

export type HStackProps<T extends ElementType = 'div'> = Omit<StackProps<T>, 'direction'>;

export function HStack<T extends ElementType = 'div'>(props: HStackProps<T>) {
  return <Stack<T> {...(props as StackProps<T>)} direction="row" />;
}

export type VStackProps<T extends ElementType = 'div'> = Omit<StackProps<T>, 'direction'>;

export function VStack<T extends ElementType = 'div'>(props: VStackProps<T>) {
  return <Stack<T> {...(props as StackProps<T>)} direction="column" />;
}
