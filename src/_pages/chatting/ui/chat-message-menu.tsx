import type { ReactElement } from 'react';

import { Icon } from '@/shared/ui/icon';
import { Menu, type MenuItem } from '@/shared/ui/menu';

type ChatMessageMenuProps = {
  children: ReactElement;
  messageContent: string;
  messageId: number;
  onReport?: (target: ChatReportTarget) => void;
  reportedUserId?: number;
};

export type ChatReportTarget =
  | {
      type: 'message';
      reportedMessageId: number;
      reportedUserId: number;
    }
  | {
      type: 'user';
      reportedUserId: number;
    };

export function ChatMessageMenu({
  children,
  messageContent,
  messageId,
  onReport,
  reportedUserId,
}: ChatMessageMenuProps) {
  const menuItems: MenuItem[] = [
    {
      id: 'copy-message',
      icon: <Icon aria-hidden="true" name="copy" size={24} />,
      content: '복사하기',
      onClick: () => {
        void navigator.clipboard?.writeText(messageContent);
      },
    },
  ];

  if (reportedUserId !== undefined && onReport) {
    menuItems.push(
      {
        id: 'report-chat',
        icon: <Icon aria-hidden="true" name="messageSquareWarning" size={24} />,
        content: '채팅 신고하기',
        onClick: () => onReport({ type: 'message', reportedMessageId: messageId, reportedUserId }),
      },
      {
        id: 'report-user',
        icon: <Icon aria-hidden="true" name="userRoundX" size={24} />,
        content: '유저 신고하기',
        onClick: () => onReport({ type: 'user', reportedUserId }),
      },
    );
  }

  return (
    <Menu
      aria-label="메시지 메뉴"
      items={menuItems}
      longPressDelay={1000}
      triggerNativeButton={false}
    >
      {children}
    </Menu>
  );
}
