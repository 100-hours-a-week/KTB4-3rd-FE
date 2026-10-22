'use client';

import { ChatRoomWebSocketConnection } from '@/features/chatting';

import { useChattingPageModel } from '@/_pages/chatting/model/use-chatting-page-model';

import { ChattingPageContent } from './chatting-page-content';

export type ChattingPageProps = {
  roomId: string;
};

export function ChattingPage({ roomId }: ChattingPageProps) {
  const { actionDialogs, screen, settlementDialogs, websocket } = useChattingPageModel(roomId);

  return (
    <ChatRoomWebSocketConnection
      enabled={Boolean(screen.room)}
      roomId={roomId}
      onMessage={websocket.onMessage}
      onSettlementAnalysisFinished={websocket.onSettlementAnalysisFinished}
    >
      {(connection) => (
        <ChattingPageContent
          actionDialogs={actionDialogs}
          screen={{ ...screen, connection }}
          settlementDialogs={settlementDialogs}
        />
      )}
    </ChatRoomWebSocketConnection>
  );
}
