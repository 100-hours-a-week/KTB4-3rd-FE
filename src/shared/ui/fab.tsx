import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { Button, type ButtonProps } from './button';

export type FabProps = Omit<
  ButtonProps,
  'prefixIcon' | 'suffixIcon' | 'size' | 'textVariant' | 'width'
> & {
  leftSlot?: ReactNode | null;
  rightSlot?: ReactNode | null;
};

export function Fab({
  children,
  className,
  leftSlot,
  rightSlot,
  variant = 'brand-solid',
  ...props
}: FabProps) {
  return (
    <Button
      {...props}
      className={cn(
        '!h-[var(--dimension-x12)] !min-h-[var(--dimension-x12)] !min-w-[var(--dimension-x12)] !max-h-[var(--dimension-x12)] !gap-[var(--dimension-x0_5)] !rounded-full !border-[var(--color-stroke-neutral-subtle)] !px-[var(--dimension-x3)] !py-0 shadow-[0px_2px_10px_0px_rgba(0,0,0,0.1)]',
        className,
      )}
      prefixIcon={leftSlot}
      size="large"
      suffixIcon={rightSlot}
      textVariant="t5Bold"
      variant={variant}
    >
      {children}
    </Button>
  );
}
