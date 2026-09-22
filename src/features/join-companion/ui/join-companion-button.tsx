import type { MouseEventHandler } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

export type JoinCompanionButtonProps = {
  className?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export function JoinCompanionButton({ className, disabled, onClick }: JoinCompanionButtonProps) {
  return (
    <Button
      className={cn('!rounded-[22px]', className)}
      disabled={disabled}
      onClick={onClick}
      variant="brand-solid"
      width="fill"
    >
      채팅 참여하기
    </Button>
  );
}
