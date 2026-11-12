import { ChatRoomContent, type ChatRoomContentProps } from './chat-room-content';

export type CompanionChatRoomContentProps = ChatRoomContentProps;

export function CompanionChatRoomContent(props: CompanionChatRoomContentProps) {
  return <ChatRoomContent {...props} />;
}
