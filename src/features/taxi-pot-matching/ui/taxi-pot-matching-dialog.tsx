'use client';

import type { MouseEventHandler } from 'react';

import { cn } from '@/shared/lib/cn';
import { Dialog } from '@/shared/ui/dialog';
import { LoadingDots } from '@/shared/ui/loading-dots';

const dialogSurfaceClassName =
  '!w-[333px] !max-w-[calc(100%-40px)] !bg-[var(--color-bg-brand-weak)] !text-black !shadow-none';
const actionFooterClassName =
  '[&_[data-testid=dialog-footer]]:!absolute [&_[data-testid=dialog-footer]]:!left-[25px] [&_[data-testid=dialog-footer]]:!w-[284px] [&_[data-testid=dialog-footer]]:!p-0';
const actionButtonClassName =
  '!h-[46px] !min-h-[46px] !rounded-[8px] !px-4 !py-[10px] [&>span]:!text-[var(--font-size-t5)] [&>span]:!leading-[var(--line-height-t5)]';

export type TaxiPotMatchingDialogProps = {
  open: boolean;
  canceling?: boolean;
  onConfirm?: () => void;
  onCancel?: MouseEventHandler<HTMLButtonElement>;
};

export function TaxiPotMatchingDialog({
  open,
  canceling = false,
  onConfirm,
  onCancel,
}: TaxiPotMatchingDialogProps) {
  return (
    <Dialog
      buttons="primarySecondary"
      className={cn(
        dialogSurfaceClassName,
        actionFooterClassName,
        '[&_[data-testid=dialog-footer]]:!flex-col [&_[data-testid=dialog-footer]]:!gap-0',
        '!h-[275px]',
        '[&_[data-testid=dialog-header]]:!px-6 [&_[data-testid=dialog-header]]:!pt-7',
        '[&_[data-testid=dialog-header]_p]:!mt-4',
        '[&_[data-testid=dialog-footer]]:!bottom-6',
      )}
      description={
        <>
          매칭이 완료되면 자동으로
          <br />
          채팅방으로 이동해요.
        </>
      }
      disablePointerDismissal
      open={open}
      primaryButtonProps={{ className: actionButtonClassName, onClick: onConfirm }}
      primaryLabel="확인"
      primaryVariant="neutral-solid"
      secondaryButtonProps={{
        className: actionButtonClassName,
        disabled: canceling,
        loading: canceling,
        onClick: onCancel,
      }}
      secondaryLabel="매칭 취소"
      secondaryVariant="ghost"
      showCloseButton={false}
      title={
        <span className="inline-flex items-center gap-3">
          택시팟을 매칭 중이에요
          <LoadingDots />
        </span>
      }
    />
  );
}
