import { TaxiPotRideActionNotice, type TaxiPotRideAction } from '@/features/taxi-pot-chat';

import { ChatRoomContent, type ChatRoomContentProps } from './chat-room-content';

export type CarpoolChatRoomContentProps = Omit<ChatRoomContentProps, 'bottomContent'> & {
  isCarpoolHost: boolean;
  rideAction?: TaxiPotRideAction;
  rideActionLoading: boolean;
  onRideActionConfirm: () => void;
};

export function CarpoolChatRoomContent({
  isCarpoolHost,
  rideAction,
  rideActionLoading,
  onRideActionConfirm,
  ...contentProps
}: CarpoolChatRoomContentProps) {
  const bottomContent =
    isCarpoolHost && rideAction ? (
      <TaxiPotRideActionNotice
        action={rideAction}
        loading={rideActionLoading}
        onConfirm={onRideActionConfirm}
      />
    ) : null;

  return <ChatRoomContent {...contentProps} bottomContent={bottomContent} />;
}
