import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';

export type PostDetailInfoRowProps = {
  className?: string;
  label: string;
  value: ReactNode;
};

export function PostDetailInfoRow({ className, label, value }: PostDetailInfoRowProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <Text color="fg.neutralMuted" variant="t4Regular">
        {label}
      </Text>
      <Text align="right" color="fg.neutral" variant="t4Regular">
        {value}
      </Text>
    </div>
  );
}
