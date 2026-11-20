import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

type MatchingActionButtonProps = {
  children: ReactNode;
  icon: ReactNode;
  className: string;
  onClick: () => void;
};

export function MatchingActionButton({
  children,
  icon,
  className,
  onClick,
}: MatchingActionButtonProps) {
  return (
    <Button
      className={cn(
        'relative !h-[43px] !min-h-[43px] !min-w-0 !rounded-full !border-[var(--color-stroke-neutral-subtle)] !bg-[var(--color-bg-layer-default)] !px-0 !py-0 !text-[var(--color-fg-brand)] shadow-[0px_2px_10px_0px_rgba(0,0,0,0.1)]',
        className,
      )}
      prefixIcon={icon}
      size="medium"
      textVariant="t5Bold"
      type="button"
      variant="neutral-weak"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
