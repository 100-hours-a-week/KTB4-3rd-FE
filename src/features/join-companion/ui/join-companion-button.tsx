import type { MouseEventHandler, ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

export type JoinCompanionButtonProps = {
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  label?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export function JoinCompanionButton({
  className,
  disabled,
  loading,
  label = '채팅 참여하기',
  type = 'button',
  onClick,
}: JoinCompanionButtonProps) {
  return (
    <Button
      className={cn('!rounded-[22px]', className)}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      type={type}
      variant="brand-solid"
      width="fill"
    >
      {label}
    </Button>
  );
}
