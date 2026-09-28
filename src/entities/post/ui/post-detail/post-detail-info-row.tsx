import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';

export type PostDetailInfoRowProps = {
  className?: string;
  label: string;
  layout?: 'modal' | 'page';
  value: ReactNode;
};

export function PostDetailInfoRow({
  className,
  label,
  layout = 'modal',
  value,
}: PostDetailInfoRowProps) {
  const isPageLayout = layout === 'page';

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4',
        isPageLayout && 'grid h-5 grid-cols-[105px_206px] items-start gap-[14px]',
        className,
      )}
    >
      <Text
        className={isPageLayout ? '!leading-5' : undefined}
        color="fg.neutralMuted"
        variant={isPageLayout ? 't5Regular' : 't4Regular'}
      >
        {label}
      </Text>
      <Text
        align={isPageLayout ? 'left' : 'right'}
        className={isPageLayout ? '!leading-5' : undefined}
        color="fg.neutral"
        variant={isPageLayout ? 't5Bold' : 't4Regular'}
      >
        {value}
      </Text>
    </div>
  );
}
