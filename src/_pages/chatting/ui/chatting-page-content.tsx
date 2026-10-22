'use client';

import { SnackbarViewport } from '@/shared/ui/snackbar-viewport';

import { ChatRoomActionDialogs, type ChatRoomActionDialogsProps } from './chat-room-action-dialogs';
import { ChatRoomMeterDialogs, type ChatRoomMeterDialogsProps } from './chat-room-meter-dialogs';
import { ChatRoomScreen, type ChatRoomScreenProps } from './chat-room-screen';
import {
  ChatRoomTransferDialogs,
  type ChatRoomTransferDialogsProps,
} from './chat-room-transfer-dialogs';

export type ChattingPageContentProps = {
  screen: ChatRoomScreenProps;
  actionDialogs: ChatRoomActionDialogsProps;
  settlementDialogs: {
    meter: ChatRoomMeterDialogsProps;
    transfer: ChatRoomTransferDialogsProps;
  };
};

export function ChattingPageContent({
  screen,
  actionDialogs,
  settlementDialogs,
}: ChattingPageContentProps) {
  return (
    <ChatRoomScreen {...screen}>
      <SnackbarViewport className="fixed inset-x-0 bottom-[calc(98px+env(safe-area-inset-bottom,0px)+16px)] z-[2147483647] mx-auto max-w-[393px] px-5" />
      <ChatRoomActionDialogs {...actionDialogs} />
      {screen.variant.taxiPotDetail ? (
        <>
          <ChatRoomMeterDialogs {...settlementDialogs.meter} />
          <ChatRoomTransferDialogs {...settlementDialogs.transfer} />
        </>
      ) : null}
    </ChatRoomScreen>
  );
}
