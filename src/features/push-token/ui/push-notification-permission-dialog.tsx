import { Dialog, type DialogButtonProps, type DialogProps } from '@/shared/ui/dialog';

export type PushNotificationPermissionDialogProps = Omit<
  DialogProps,
  | 'buttons'
  | 'children'
  | 'description'
  | 'primaryButtonProps'
  | 'primaryLabel'
  | 'secondaryLabel'
  | 'showCloseButton'
  | 'title'
> & {
  onEnable?: DialogButtonProps['onClick'];
};

export function PushNotificationPermissionDialog({
  onEnable,
  ...props
}: PushNotificationPermissionDialogProps) {
  return (
    <Dialog
      {...props}
      buttons="primarySecondary"
      description="댓글과 카풀 요청, 매칭 소식을 놓치지 않도록 알려드릴게요."
      primaryButtonProps={{ onClick: onEnable }}
      primaryVariant="neutral-solid"
      primaryLabel="알림 받기"
      secondaryLabel="나중에"
      showCloseButton={false}
      title="푸시 알림 권한을 허용해주세요"
    />
  );
}
