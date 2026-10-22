'use client';

import { ChatRoomWebSocketConnection } from '@/features/chatting';

import { useChattingPageModel } from '@/_pages/chatting/model/use-chatting-page-model';

import { ChattingPageContent } from './chatting-page-content';

export type ChattingPageProps = {
  roomId: string;
};

export function ChattingPage({ roomId }: ChattingPageProps) {
  const model = useChattingPageModel(roomId);

  return (
    <ChatRoomWebSocketConnection
      enabled={Boolean(model.room)}
      roomId={roomId}
      onMessage={model.onMessage}
      onSettlementAnalysisFinished={model.onSettlementAnalysisFinished}
    >
      {(connection) => <ChattingPageContent {...model} connection={connection} />}
    </ChatRoomWebSocketConnection>
  );
}
