import type { ReactElement } from 'react';

import { Icon } from '@/shared/ui/icon';
import { Menu, type MenuItem } from '@/shared/ui/menu';

type ChatMessageMenuProps = {
  children: ReactElement;
  onReport: () => void;
};

export function ChatMessageMenu({ children, onReport }: ChatMessageMenuProps) {
  const menuItems: MenuItem[] = [
    {
      id: 'report-chat',
      icon: <Icon aria-hidden="true" name="messageSquareWarning" size={24} />,
      content: '채팅 신고하기',
      onClick: onReport,
    },
    {
      id: 'report-user',
      icon: <Icon aria-hidden="true" name="userRoundX" size={24} />,
      content: '유저 신고하기',
      onClick: onReport,
    },
  ];

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
