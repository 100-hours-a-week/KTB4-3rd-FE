'use client';

import { cn } from '@/shared/lib/cn';
import { Dialog } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { LoadingDots } from '@/shared/ui/loading-dots';

const dialogSurfaceClassName =
  '!w-[333px] !max-w-[calc(100%-40px)] !bg-[var(--color-bg-brand-weak)] !text-black !shadow-none';
const actionFooterClassName =
  '[&_[data-testid=dialog-footer]]:!absolute [&_[data-testid=dialog-footer]]:!left-[25px] [&_[data-testid=dialog-footer]]:!w-[284px] [&_[data-testid=dialog-footer]]:!p-0';
const actionButtonClassName =
  '!h-[46px] !min-h-[46px] !rounded-[8px] !px-4 !py-[10px] [&>span]:!text-[var(--font-size-t5)] [&>span]:!leading-[var(--line-height-t5)]';

export type TaxiMeterAnalysisDialogProps = {
  open: boolean;
  delayed?: boolean;
  completionMessage?: string;
  onManualEntry?: () => void;
  onOpenChange?: (open: boolean) => void;
};

/** The meter photo remains in analysis; the parent controls when this dialog ends. */
export function TaxiMeterAnalysisDialog({
  open,
  delayed = false,
  completionMessage = '동승자에게 금액이 청구돼요.',
  onManualEntry,
  onOpenChange,
}: TaxiMeterAnalysisDialogProps) {
  return (
    <Dialog
      buttons={delayed ? 'primary' : 'none'}
      className={cn(
        dialogSurfaceClassName,
        actionFooterClassName,
        delayed && '[&_[data-testid=dialog-footer]]:!bottom-6',
        delayed ? '!h-[219px]' : '!h-[151px]',
        '[&_[data-testid=dialog-header]]:!px-6 [&_[data-testid=dialog-header]]:!pt-7',
        '[&_[data-testid=dialog-header]_p]:!mt-4',
      )}
      description={
        delayed ? (
          <>
            AI 분석이 지연되고있어요.
            <br />
            잠시만 기다려주세요.
          </>
        ) : (
          <>
            분석이 완료되면 자동으로
            <br />
            {completionMessage}
          </>
        )
      }
      disablePointerDismissal
      onOpenChange={onOpenChange}
      open={open}
      primaryButtonProps={{ className: actionButtonClassName, onClick: onManualEntry }}
      primaryLabel="수동 입력하기"
      primaryVariant="neutral-solid"
      showCloseButton={false}
      title={
        <span className="inline-flex items-center gap-3">
          이미지를 분석하고있어요
          {delayed ? null : <LoadingDots />}
        </span>
      }
    />
  );
}

export type TaxiMeterAmountDialogProps = {
  open: boolean;
  value: string;
  onValueChange: (value: string) => void;
  recognitionFailed?: boolean;
  onSettle?: () => void;
  onRetakePhoto?: () => void;
  onOpenChange?: (open: boolean) => void;
};

/** The parent submits the entered fare as part of the settlement flow. */
export function TaxiMeterAmountDialog({
  open,
  value,
  onValueChange,
  recognitionFailed = false,
  onSettle,
  onRetakePhoto,
  onOpenChange,
}: TaxiMeterAmountDialogProps) {
  return (
    <Dialog
      buttons={recognitionFailed ? 'primarySecondary' : 'primary'}
      className={cn(
        dialogSurfaceClassName,
        actionFooterClassName,
        recognitionFailed
          ? '[&_[data-testid=dialog-footer]]:!bottom-3 [&_[data-testid=dialog-footer]]:!flex-col [&_[data-testid=dialog-footer]]:!gap-0'
          : '[&_[data-testid=dialog-footer]]:!bottom-[26px]',
        recognitionFailed ? '!h-[290px]' : '!h-[232px]',
        '[&_[data-testid=dialog-body]]:!px-[22px] [&_[data-testid=dialog-body]]:!pt-5 [&_[data-testid=dialog-body]]:!pb-0',
      )}
      description={recognitionFailed ? '결제 금액을 직접 입력해주세요' : undefined}
      onOpenChange={onOpenChange}
      open={open}
      primaryButtonProps={{ className: actionButtonClassName, onClick: onSettle }}
      primaryLabel="정산하기"
      primaryVariant="neutral-solid"
      secondaryButtonProps={{
        className: cn(
          actionButtonClassName,
          '!bg-transparent !text-[var(--color-fg-neutral)] active:!bg-[var(--color-bg-transparent-pressed)]',
        ),
        onClick: onRetakePhoto,
      }}
      secondaryLabel="사진 다시 찍기"
      showCloseButton={false}
      title={recognitionFailed ? '사진 인식을 실패했어요' : '결제 금액을 직접 입력해주세요'}
    >
      <Input
        aria-label="결제 금액"
        disableFocusBorder
        inputClassName="focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-[var(--color-stroke-focus-ring)]"
        inputMode="numeric"
        onValueChange={(nextValue) => onValueChange(nextValue.replace(/\D/g, ''))}
        placeholder="금액을 입력해주세요"
        value={value}
      />
    </Dialog>
  );
}
