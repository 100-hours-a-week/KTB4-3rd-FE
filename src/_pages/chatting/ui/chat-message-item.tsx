import { Bubble, ChatNotice } from '@/features/chatting';
import { cn } from '@/shared/lib/cn';

import type { ChatRoomMessage } from '@/_pages/chatting/model/chat-room';

import { ChatMessageMenu } from './chat-message-menu';

const initialMessageSpacing = ['', 'mt-[41px]', 'mt-[47px]', 'mt-[27px]', 'mt-[41px]'];

type ChatMessageItemProps = {
  message: ChatRoomMessage;
  index: number;
  onReport: () => void;
};

function getMessageClassName(message: ChatRoomMessage, index: number) {
  const spacing = initialMessageSpacing[index] ?? 'mt-4';

  if (message.kind === 'notice') {
    return cn(spacing, 'self-center');
  }

  return cn(spacing, message.variant === 'me' && 'self-end mr-[10px]');
}

export function ChatMessageItem({ message, index, onReport }: ChatMessageItemProps) {
  if (message.kind === 'notice') {
    return (
      <ChatNotice className={getMessageClassName(message, index)} data-message-id={message.id}>
        {message.content}
      </ChatNotice>
    );
  }

  const bubble = (
    <Bubble
      aria-label={message.variant === 'other' ? '메시지 메뉴 열기' : undefined}
      className={cn(
        getMessageClassName(message, index),
        '!py-[14px]',
        message.layout === 'tall' && '!h-[82px] !w-[248px] !max-w-none !p-4',
      )}
      data-message-id={message.id}
      role={message.variant === 'other' ? 'button' : undefined}
      tabIndex={message.variant === 'other' ? 0 : undefined}
      variant={message.variant}
    >
      {message.content}
    </Bubble>
  );

  if (message.variant !== 'other') {
    return bubble;
  }

  return <ChatMessageMenu onReport={onReport}>{bubble}</ChatMessageMenu>;
}
