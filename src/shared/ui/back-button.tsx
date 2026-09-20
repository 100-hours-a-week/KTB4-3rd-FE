import Link, { type LinkProps } from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon } from './icon';

export type BackButtonProps = Omit<
  ComponentPropsWithoutRef<typeof Link>,
  'children' | 'aria-label'
> &
  Pick<LinkProps, 'href'>;

export function BackButton({ className, ...props }: BackButtonProps) {
  return (
    <Link
      {...props}
      aria-label="뒤로가기"
      className={cn(
        'inline-flex size-11 items-center justify-center rounded-[var(--dimension-x2)]',
        className,
      )}
    >
      <Icon name="chevronLeft" size={24} />
    </Link>
  );
}
