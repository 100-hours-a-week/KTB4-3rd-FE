import type { MouseEventHandler } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

export type JoinCompanionButtonProps = {
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export function JoinCompanionButton({
  className,
  disabled,
  loading,
  onClick,
}: JoinCompanionButtonProps) {
  return (
    <Button
      className={cn('!rounded-[22px]', className)}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      variant="brand-solid"
      width="fill"
    >
      채팅 참여하기
    </Button>
  );
}
