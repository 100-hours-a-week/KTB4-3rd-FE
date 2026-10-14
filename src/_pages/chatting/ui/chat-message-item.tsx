import { Bubble, ChatNotice } from '@/features/chatting';
import {
  TransferCompletionConfirmationSystemMessage,
  TransferCompletionSystemMessage,
} from '@/features/taxi-pot-settlement';
import { cn } from '@/shared/lib/cn';
import { Avatar } from '@/shared/ui/avatar';
import { Text } from '@/shared/ui/text';

import type { ChatRoomMessage } from '@/_pages/chatting/model/chat-room';

import { ChatMessageMenu, type ChatReportTarget } from './chat-message-menu';

const initialMessageSpacing = ['', 'mt-[41px]', 'mt-[47px]', 'mt-[27px]', 'mt-[41px]'];

type ChatMessageItemProps = {
  message: ChatRoomMessage;
  index: number;
  onReport: (target: ChatReportTarget) => void;
  transferAmount?: number;
};

function getTransferCompletionDetails(content: string, fallbackAmount: number) {
  const nickname = content.match(/^(.+?)님이 송금을 완료했어요!?/)?.[1] ?? '동승자';
  const amountText = content.match(/(?:금액\s*)?([\d,]+)\s*원/)?.[1];

  return {
    amount: amountText ? Number(amountText.replaceAll(',', '')) : fallbackAmount,
    nickname,
  };
}

function getMessageClassName(message: ChatRoomMessage, index: number) {
  const spacing = initialMessageSpacing[index] ?? 'mt-4';

  if (message.kind === 'notice') {
    return cn(spacing, 'self-center');
  }

  return cn(spacing, message.variant === 'me' && 'self-end mr-[10px]');
}

export function ChatMessageItem({
  message,
  index,
  onReport,
  transferAmount = 0,
}: ChatMessageItemProps) {
  if (message.kind === 'notice') {
    const className = getMessageClassName(message, index);

    if (message.systemType === 'SYSTEM_TRANSFER_DONE') {
      const { amount, nickname } = getTransferCompletionDetails(message.content, transferAmount);

      return (
        <TransferCompletionSystemMessage
          amount={amount}
          className={className}
          nickname={nickname}
          onViewReceipt={() => undefined}
        />
      );
    }

    if (message.systemType === 'SYSTEM_SETTLEMENT_CONFIRM_REQUESTED') {
      return (
        <TransferCompletionConfirmationSystemMessage
          className={className}
          onAcknowledge={() => undefined}
        />
      );
    }

    return (
      <ChatNotice className={className} data-message-id={message.id} variant={message.variant}>
        {message.content}
      </ChatNotice>
    );
  }

  const messageClassName = getMessageClassName(message, index);
  const isOtherMessage = message.variant === 'other';
  const hasSenderNickname = message.variant === 'other' && Boolean(message.senderNickname);
  const numericMessageId = Number(message.id);
  const canReportMessage = message.variant === 'other' && message.senderId !== undefined;
  const canOpenMessageMenu =
    Number.isSafeInteger(numericMessageId) && (message.variant === 'me' || canReportMessage);
  const bubble = (
    <Bubble
      aria-label={canOpenMessageMenu ? '메시지 메뉴 열기' : undefined}
      className={cn(
        !hasSenderNickname && messageClassName,
        '!py-[14px]',
        message.layout === 'tall' && '!h-[82px] !w-[248px] !max-w-none !p-4',
        message.layout === 'large' && '!h-[112px] !w-[301px] !max-w-none !p-4',
      )}
      data-message-id={message.id}
      loading={message.loading}
      role={canOpenMessageMenu ? 'button' : undefined}
      tabIndex={canOpenMessageMenu ? 0 : undefined}
      variant={message.variant}
    >
      {message.content}
    </Bubble>
  );

  const bubbleWithMenu = canOpenMessageMenu ? (
    <ChatMessageMenu
      messageContent={message.content}
      messageId={numericMessageId}
      onReport={canReportMessage ? onReport : undefined}
      reportedUserId={canReportMessage ? message.senderId : undefined}
    >
      {bubble}
    </ChatMessageMenu>
  ) : (
    bubble
  );

  const avatar = isOtherMessage ? (
    <Avatar
      alt={`${message.senderNickname ?? '상대방'} 프로필`}
      size="sm"
      src={message.senderProfileImageUrl}
    />
  ) : null;

  if (!hasSenderNickname) {
    return isOtherMessage ? (
      <div className={cn(messageClassName, 'flex self-start items-end gap-2')}>
        {avatar}
        {bubbleWithMenu}
      </div>
    ) : (
      bubbleWithMenu
    );
  }

  return (
    <div className={cn(messageClassName, 'flex self-start flex-col items-start')}>
      <Text as="span" className="mb-1 ml-1" color="fg.neutralMuted" variant="t5Regular">
        {message.senderNickname}
      </Text>
      <div className="flex items-end gap-2">
        {avatar}
        {bubbleWithMenu}
      </div>
    </div>
  );
}
