import { useMemo } from 'react';

import { ChatComposer, type ChatRoomWebSocketConnectionValue } from '@/features/chatting';
import {
  TaxiPotAnnouncement,
  TaxiPotRideActionNotice,
  type TaxiPotDetailData,
  type TaxiPotRideAction,
} from '@/features/taxi-pot-chat';

import type { ChatRoom, ChatRoomMessage } from '@/_pages/chatting/model/chat-room';

import { ChatMessageList } from './chat-message-list';
import type { ChatReportTarget } from './chat-message-menu';
import {
  TaxiPotChatMessageItem,
  type TaxiPotMeterMessageProps,
  type TaxiPotTransferMessageProps,
  type TaxiPotChatMessageItemProps,
} from './taxi-pot-chat-message-item';
import type { ChatRoomContentProps } from './chat-room-content';

type ChatRoomMessageAreaProps = Omit<
  ChatRoomContentProps,
  'bottomContent' | 'connection' | 'room' | 'topContent'
>;

export type TaxiPotMeterMessageAreaProps = TaxiPotMeterMessageProps & {
  hideMeterRequestMessage: boolean;
  isTaxiPotHost: boolean;
  uploadingMeterPhoto: boolean;
};

export type TaxiPotTransferMessageAreaProps = TaxiPotTransferMessageProps & {
  completingSettlement: boolean;
  isTaxiPotHost: boolean;
  settlementId?: number;
  transferSubmissionBlockedSettlementId: number | null;
  uploadingTransferPhoto: boolean;
};

export type TaxiPotSettlementMessageAreaProps = {
  meter: TaxiPotMeterMessageAreaProps;
  transfer: TaxiPotTransferMessageAreaProps;
};

export type TaxiPotChatRoomContentProps = ChatRoomMessageAreaProps & {
  room: ChatRoom;
  liveMessages: readonly ChatRoomMessage[];
  connection: ChatRoomWebSocketConnectionValue;
  onReport: (target: ChatReportTarget) => void;
  taxiPotDetail: TaxiPotDetailData;
  isTaxiPotHost: boolean;
  rideAction?: TaxiPotRideAction;
  rideActionLoading: boolean;
  onRideActionConfirm: () => void;
  settlement: TaxiPotSettlementMessageAreaProps;
};

function formatDepartureTime(departureAt: string) {
  const departure = new Date(departureAt);

  if (Number.isNaN(departure.getTime())) {
    return '-';
  }

  return departure.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function shouldDisplayMessage(
  message: ChatRoomMessage,
  hideMeterRequestMessage: boolean,
  isTaxiPotHost: boolean,
) {
  if (
    hideMeterRequestMessage &&
    message.kind === 'notice' &&
    message.systemType === 'SYSTEM_METER_REQUESTED'
  ) {
    return false;
  }

  return !(
    !isTaxiPotHost &&
    message.kind === 'notice' &&
    message.systemType === 'SYSTEM_TRANSFER_UNVERIFIED'
  );
}

function getLatestTransferContext(
  messages: readonly ChatRoomMessage[],
  fallbackSettlementId?: number,
) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message?.kind === 'notice' && message.systemType === 'SYSTEM_TRANSFER_REQUESTED') {
      return {
        transferAmount: message.settlement.amount_per_person,
        transferSettlementId: message.settlement.settlement_id,
      };
    }
  }

  return { transferAmount: 0, transferSettlementId: fallbackSettlementId };
}

export function TaxiPotChatRoomContent({
  room,
  liveMessages,
  onReport,
  connection,
  hasPreviousMessages = false,
  hasNewerMessages = false,
  isFetchingPreviousMessages = false,
  isFetchingNewerMessages = false,
  isFetchPreviousMessagesError = false,
  isFetchNewerMessagesError = false,
  onLoadPreviousMessages,
  onLoadNewerMessages,
  hasNewMessages = false,
  taxiPotDetail,
  isTaxiPotHost,
  rideAction,
  rideActionLoading,
  onRideActionConfirm,
  settlement,
}: TaxiPotChatRoomContentProps) {
  const messages = useMemo(() => {
    const visibleRoomMessages = room.messages.filter((message) =>
      shouldDisplayMessage(message, settlement.meter.hideMeterRequestMessage, isTaxiPotHost),
    );
    const visibleLiveMessages = liveMessages.filter((message) =>
      shouldDisplayMessage(message, settlement.meter.hideMeterRequestMessage, isTaxiPotHost),
    );
    const roomMessageIds = new Set(visibleRoomMessages.map((message) => message.id));

    return [
      ...visibleRoomMessages,
      ...visibleLiveMessages.filter((message) => !roomMessageIds.has(message.id)),
    ];
  }, [isTaxiPotHost, liveMessages, room.messages, settlement.meter.hideMeterRequestMessage]);
  const { transferAmount, transferSettlementId } = getLatestTransferContext(
    messages,
    settlement.transfer.settlementId,
  );
  const bottomContent =
    isTaxiPotHost && rideAction ? (
      <TaxiPotRideActionNotice
        action={rideAction}
        loading={rideActionLoading}
        onConfirm={onRideActionConfirm}
      />
    ) : null;
  const renderMessage = (message: ChatRoomMessage, index: number) => {
    const messageProps: TaxiPotChatMessageItemProps = {
      index,
      message,
      onReport,
      meter: settlement.meter,
      transfer: {
        ...settlement.transfer,
        transferAmount,
        transferPhotoDisabled:
          message.kind === 'notice' &&
          message.systemType === 'SYSTEM_TRANSFER_REQUESTED' &&
          settlement.transfer.transferSubmissionBlockedSettlementId ===
            message.settlement.settlement_id,
        transferSettlementId,
      },
    };

    return <TaxiPotChatMessageItem {...messageProps} />;
  };

  return (
    <section className="relative flex min-h-0 flex-1 flex-col">
      <TaxiPotAnnouncement
        className="absolute inset-x-3 top-1.5 z-10"
        departureTime={formatDepartureTime(taxiPotDetail.departure_at)}
      />
      <ChatMessageList
        lastReadMessageId={room.lastReadMessageId}
        messages={messages}
        onReport={onReport}
        renderMessage={renderMessage}
        roomId={room.id}
        hasPreviousMessages={hasPreviousMessages}
        hasNewerMessages={hasNewerMessages}
        isFetchingPreviousMessages={isFetchingPreviousMessages}
        isFetchingNewerMessages={isFetchingNewerMessages}
        isFetchPreviousMessagesError={isFetchPreviousMessagesError}
        isFetchNewerMessagesError={isFetchNewerMessagesError}
        onLoadPreviousMessages={onLoadPreviousMessages}
        onLoadNewerMessages={onLoadNewerMessages}
        hasNewMessages={hasNewMessages}
        liveMessageCount={liveMessages.length}
        bottomContent={bottomContent}
      />
      <ChatComposer
        className="!fixed bottom-0 left-1/2 z-20 !h-[calc(98px+env(safe-area-inset-bottom,0px))] w-full max-w-[393px] -translate-x-1/2 border-t border-[var(--color-stroke-neutral-weak)] !pb-[env(safe-area-inset-bottom,0px)]"
        disabled={room.memberCount === 1}
        onSubmit={(content) => connection.sendMessage(content)}
        submitDisabled={connection.status !== 'open'}
      />
    </section>
  );
}
