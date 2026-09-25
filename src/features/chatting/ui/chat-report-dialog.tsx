import { useState } from 'react';

import { Dialog, type DialogButtonProps, type DialogProps } from '@/shared/ui/dialog';
import { Radio, RadioGroup } from '@/shared/ui/radio';
import { Textarea } from '@/shared/ui/textarea';
import { cn } from '@/shared/lib/cn';

export const chatReportReasonOptions = [
  { label: '비방, 욕설', value: 'abuse' },
  { label: '미정산', value: 'unpaid' },
  { label: '노쇼', value: 'noShow' },
  { label: '기타', value: 'other' },
] as const;

export type ChatReportReason = (typeof chatReportReasonOptions)[number]['value'];

export type ChatReportDialogSubmitPayload = {
  description: string;
  reason: ChatReportReason;
};

export type ChatReportDialogSubmitButtonProps = Omit<DialogButtonProps, 'onClick'>;

export type ChatReportDialogProps = Omit<
  DialogProps,
  | 'buttons'
  | 'children'
  | 'description'
  | 'primaryButtonProps'
  | 'primaryLabel'
  | 'secondaryButtonProps'
  | 'secondaryLabel'
  | 'showCloseButton'
  | 'title'
> & {
  defaultDescription?: string;
  defaultReason?: ChatReportReason;
  onSubmit?: (payload: ChatReportDialogSubmitPayload) => void;
  submitButtonProps?: ChatReportDialogSubmitButtonProps;
};

const defaultReason: ChatReportReason = 'abuse';

export function ChatReportDialog({
  className,
  defaultDescription = '',
  defaultReason: initialReason = defaultReason,
  onSubmit,
  submitButtonProps,
  ...props
}: ChatReportDialogProps) {
  const [reason, setReason] = useState<ChatReportReason>(initialReason);
  const [description, setDescription] = useState(defaultDescription);

  return (
    <Dialog
      {...props}
      buttons="primary"
      className={cn(
        '!max-h-none !w-[calc(100%-40px)] !max-w-[353px]',
        '[&>div:has([data-testid=dialog-body])]:!flex-none [&>div:has([data-testid=dialog-body])]:!overflow-visible',
        '[&_[data-testid=dialog-body]]:!flex-none [&_[data-testid=dialog-body]]:!h-[303px] [&_[data-testid=dialog-body]]:!min-h-[303px] [&_[data-testid=dialog-body]]:!overflow-visible [&_[data-testid=dialog-body]]:!px-[22px] [&_[data-testid=dialog-body]]:!py-0',
        '[&_[data-testid=dialog-footer]]:!pb-5 [&_[data-testid=dialog-footer]]:!pt-5',
        className,
      )}
      primaryButtonProps={{
        ...submitButtonProps,
        className: cn(
          '!rounded-[8px] !bg-[var(--color-bg-critical-solid)] !text-[var(--color-fg-neutral-inverted)] active:!bg-[var(--color-bg-critical-solid-pressed)]',
          submitButtonProps?.className,
        ),
        onClick: () => onSubmit?.({ description, reason }),
      }}
      primaryLabel="신고하기"
      showCloseButton={false}
      title="신고 사유를 선택해주세요"
    >
      <div className="h-[303px] w-full pt-5">
        <div className="flex h-[283px] w-full items-center justify-center overflow-hidden">
          <div className="flex w-[301px] max-w-full flex-col items-start">
            <RadioGroup
              aria-label="신고 사유"
              className="w-full gap-3"
              onValueChange={(value) => setReason(value as ChatReportReason)}
              value={reason}
            >
              {chatReportReasonOptions.map(({ label, value }) => (
                <Radio key={value} label={label} size="large" value={value} />
              ))}
            </RadioGroup>
            <Textarea
              aria-label="신고 내용"
              autoSize
              className="mt-2 w-full [&>div]:!h-[82px] [&>div]:!rounded-[10px] [&>div]:!px-[14px] [&>div]:!py-[12px]"
              disabled={reason !== 'other'}
              onValueChange={setDescription}
              placeholder="Placeholder"
              value={description}
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
