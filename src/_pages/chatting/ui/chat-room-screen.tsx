'use client';

import { useEffect, type ReactNode } from 'react';

import { type ChatRoomWebSocketConnectionValue } from '@/features/chatting';
import {
  type TaxiPotDetailData,
  type TaxiPotRideAction,
  type TaxiPotStatus,
} from '@/features/taxi-pot-chat';

import type { ChatRoom } from '@/_pages/chatting/model/chat-room';

import { CarpoolChatRoomContent } from './carpool-chat-room-content';
import type { ChatRoomContentProps } from './chat-room-content';
import { ChatRoomLayout } from './chat-room-layout';
import { ChatRoomState } from './chat-room-state';
import { CompanionChatRoomContent } from './companion-chat-room-content';
import {
  TaxiPotChatRoomContent,
  type TaxiPotSettlementMessageAreaProps,
} from './taxi-pot-chat-room-content';

type QueryState = {
  isError: boolean;
  isPending: boolean;
};

type ChatRoomMessageAreaProps = Omit<
  ChatRoomContentProps,
  'bottomContent' | 'connection' | 'room' | 'topContent'
>;

type ChatRoomVariantProps = {
  isRideActionHost: boolean;
  rideAction?: TaxiPotRideAction;
  rideActionLoading: boolean;
  onRideActionConfirm: () => void;
  isTaxiPotHost: boolean;
  taxiPotDetail?: TaxiPotDetailData;
  taxiPotStatus?: TaxiPotStatus;
  taxiPotSettlement: TaxiPotSettlementMessageAreaProps;
};

export type ChatRoomScreenProps = {
  connection: ChatRoomWebSocketConnectionValue;
  detailQuery: QueryState;
  messagesQuery: QueryState;
  taxiPotQuery: QueryState;
  isTaxiPot: boolean;
  room?: ChatRoom;
  onBack: () => void;
  onLeave: () => void;
  onWebSocketOpen: () => void;
  messageArea: ChatRoomMessageAreaProps;
  variant: ChatRoomVariantProps;
  children?: ReactNode;
};

export function ChatRoomScreen({
  connection,
  detailQuery,
  messagesQuery,
  taxiPotQuery,
  isTaxiPot,
  room,
  onBack,
  onLeave,
  onWebSocketOpen,
  messageArea,
  variant,
  children,
}: ChatRoomScreenProps) {
  useEffect(() => {
    if (connection.status === 'open') {
      onWebSocketOpen();
    }
  }, [connection.status, onWebSocketOpen]);

  if (detailQuery.isPending || messagesQuery.isPending || (isTaxiPot && taxiPotQuery.isPending)) {
    return (
      <ChatRoomLayout>
        <ChatRoomState label="채팅방을 불러오는 중">채팅방을 불러오는 중이에요.</ChatRoomState>
      </ChatRoomLayout>
    );
  }

  if (detailQuery.isError || messagesQuery.isError || taxiPotQuery.isError || !room) {
    return (
      <ChatRoomLayout>
        <ChatRoomState label="채팅방을 불러오지 못함">채팅방을 불러오지 못했어요.</ChatRoomState>
      </ChatRoomLayout>
    );
  }

  const onReport = messageArea.onReport ?? (() => {});
  const commonContentProps = {
    ...messageArea,
    connection,
    onReport,
    room,
  };
  let content: ReactNode;

  if (room.kind === 'TAXI_POT' && variant.taxiPotDetail) {
    content = (
      <TaxiPotChatRoomContent
        {...commonContentProps}
        isTaxiPotHost={variant.isTaxiPotHost}
        onRideActionConfirm={variant.onRideActionConfirm}
        rideAction={variant.rideAction}
        rideActionLoading={variant.rideActionLoading}
        settlement={variant.taxiPotSettlement}
        taxiPotDetail={variant.taxiPotDetail}
      />
    );
  } else if (room.kind === 'CARPOOL') {
    content = (
      <CarpoolChatRoomContent
        {...commonContentProps}
        isCarpoolHost={variant.isRideActionHost}
        onRideActionConfirm={variant.onRideActionConfirm}
        rideAction={variant.rideAction}
        rideActionLoading={variant.rideActionLoading}
      />
    );
  } else {
    content = <CompanionChatRoomContent {...commonContentProps} />;
  }
  const showLeaveButton =
    room.kind !== 'TAXI_POT' ||
    variant.taxiPotStatus === undefined ||
    variant.taxiPotStatus === 'RECRUITING';

  return (
    <>
      <ChatRoomLayout
        onBack={onBack}
        onLeave={onLeave}
        room={room}
        showLeaveButton={showLeaveButton}
      >
        {content}
      </ChatRoomLayout>
      {children}
    </>
  );
}
