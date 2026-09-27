import { Dialog, type DialogButtonProps, type DialogProps } from '@/shared/ui/dialog';

export type ChatLeaveDialogProps = Omit<
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
  confirmButtonProps?: Omit<DialogButtonProps, 'onClick'> & {
    onClick?: DialogButtonProps['onClick'];
  };
  onConfirm?: () => void;
};

export function ChatLeaveDialog({ confirmButtonProps, onConfirm, ...props }: ChatLeaveDialogProps) {
  return (
    <Dialog
      {...props}
      buttons="primarySecondary"
      description="한번 나가면 다시 들어올 수 없어요"
      primaryButtonProps={{
        ...confirmButtonProps,
        onClick: (event) => {
          onConfirm?.();
          confirmButtonProps?.onClick?.(event);
        },
      }}
      primaryLabel="확인"
      secondaryLabel="취소"
      showCloseButton={false}
      title="채팅방을 나갈까요?"
    />
  );
}
