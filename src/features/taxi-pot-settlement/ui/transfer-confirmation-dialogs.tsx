'use client';

import { cn } from '@/shared/lib/cn';
import { Dialog } from '@/shared/ui/dialog';

type SettlementNoticeDialogProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
};

export type TransferConfirmationRecognitionFailedDialogProps = SettlementNoticeDialogProps & {
  onReselectPhoto?: () => void;
};

export type UnsettledSettlementDialogProps = SettlementNoticeDialogProps & {
  onGoToSettlement?: () => void;
};

const dialogSurfaceClassName =
  '!w-[333px] !max-w-[calc(100%-40px)] !bg-[var(--color-bg-brand-weak)] !text-black !shadow-none';
const actionFooterClassName =
  '[&_[data-testid=dialog-footer]]:!absolute [&_[data-testid=dialog-footer]]:!left-[25px] [&_[data-testid=dialog-footer]]:!w-[284px] [&_[data-testid=dialog-footer]]:!p-0';
const actionButtonClassName =
  '!h-[46px] !min-h-[46px] !rounded-[8px] !px-4 !py-[10px] [&>span]:!text-[var(--font-size-t5)] [&>span]:!leading-[var(--line-height-t5)]';

export function TransferConfirmationRecognitionFailedDialog({
  open,
  onOpenChange,
  onReselectPhoto,
}: TransferConfirmationRecognitionFailedDialogProps) {
  return (
    <Dialog
      className={cn(
        dialogSurfaceClassName,
        actionFooterClassName,
        '!h-[189px]',
        '[&_[data-testid=dialog-header]]:!px-[22px] [&_[data-testid=dialog-header]]:!pt-9',
        '[&_[data-testid=dialog-footer]]:!bottom-6',
      )}
      description="사진을 다시 선택해주세요"
      onOpenChange={onOpenChange}
      open={open}
      primaryButtonProps={{ className: actionButtonClassName, onClick: onReselectPhoto }}
      primaryLabel="다시 선택하기"
      primaryVariant="neutral-solid"
      showCloseButton={false}
      title="사진 인식을 실패했어요"
    />
  );
}

export function UnsettledSettlementDialog({
  open,
  onOpenChange,
  onGoToSettlement,
}: UnsettledSettlementDialogProps) {
  return (
    <Dialog
      className={cn(
        dialogSurfaceClassName,
        actionFooterClassName,
        '!h-[185px]',
        '[&_[data-testid=dialog-header]]:!px-6 [&_[data-testid=dialog-header]]:!pt-7',
        '[&_[data-testid=dialog-header]_p]:!mt-4',
        '[&_[data-testid=dialog-footer]]:!bottom-[26px]',
      )}
      description="정산을 진행해주세요"
      onOpenChange={onOpenChange}
      open={open}
      primaryButtonProps={{ className: actionButtonClassName, onClick: onGoToSettlement }}
      primaryLabel="정산 하러가기"
      primaryVariant="neutral-solid"
      showCloseButton={false}
      title="진행하지 않은 정산이 있어요"
    />
  );
}
