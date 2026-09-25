import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Icon } from './icon';
import { Menu } from './menu';

const meta = {
  title: 'Shared/Menu',
  component: Menu,
  parameters: {
    layout: 'centered',
  },
  args: {
    'aria-label': '메뉴',
    children: (
      <button
        aria-label="채팅 메뉴 열기"
        className="rounded-[12px] bg-[var(--color-bg-neutral-weak)] px-4 py-3 text-[var(--color-fg-neutral)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]"
        type="button"
      >
        채팅 영역
      </button>
    ),
    items: [
      {
        id: 'report-chat',
        icon: <Icon aria-hidden="true" name="messageSquareWarning" size={24} />,
        content: '채팅 신고하기',
      },
      {
        id: 'report-user',
        icon: <Icon aria-hidden="true" name="userRoundX" size={24} />,
        content: '유저 신고하기',
      },
    ],
  },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ThreeItems: Story = {
  args: {
    items: [
      {
        id: 'report-chat',
        icon: <Icon aria-hidden="true" name="messageSquareWarning" size={24} />,
        content: '채팅 신고하기',
      },
      {
        id: 'report-user',
        icon: <Icon aria-hidden="true" name="userRoundX" size={24} />,
        content: '유저 신고하기',
      },
      {
        id: 'block-user',
        icon: <Icon aria-hidden="true" name="xmarkCircleFill" size={24} />,
        content: '유저 차단하기',
      },
    ],
  },
};

export const LongPress: Story = {
  args: {
    longPressDelay: 500,
  },
  render: (args) => (
    <div className="flex min-h-[180px] w-[320px] items-center justify-center rounded-[16px] bg-[var(--color-bg-layer-fill)] p-8">
      <Menu {...args}>
        <button
          aria-label="메시지 길게 눌러 메뉴 열기"
          className="w-full rounded-[12px] bg-[var(--color-bg-layer-default)] px-4 py-5 text-left text-[var(--color-fg-neutral)] shadow-[0_2px_8px_rgba(0,0,0,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]"
          type="button"
        >
          메시지를 클릭하거나 길게 눌러 보세요.
        </button>
      </Menu>
    </div>
  ),
};
