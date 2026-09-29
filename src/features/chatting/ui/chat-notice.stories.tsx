import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ChatNotice } from '@/features/chatting';

const meta = {
  title: 'Features/Chatting/ChatNotice',
  component: ChatNotice,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="flex w-[353px] flex-col items-center gap-4 bg-[var(--color-bg-layer-fill)] p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UserEntered: Story = {
  args: {
    children: 'ㅇㅇ 님이 입장하셨어요',
    variant: 'system',
  },
};

export const UserExited: Story = {
  args: {
    children: 'ㅇㅇ 님이 퇴장하셨어요',
    variant: 'system',
  },
};

export const RideStarted: Story = {
  args: {
    children: '운행이 시작됐어요',
    variant: 'informative',
  },
};

export const RideEnded: Story = {
  args: {
    children: '운행이 종료됐어요',
    variant: 'informative',
  },
};

export const Variants: Story = {
  args: {
    children: '',
  },
  render: () => (
    <div className="flex flex-col items-center gap-3">
      <ChatNotice variant="system">ㅇㅇ 님이 입장하셨어요</ChatNotice>
      <ChatNotice variant="system">ㅇㅇ 님이 퇴장하셨어요</ChatNotice>
      <ChatNotice variant="informative">운행이 시작됐어요</ChatNotice>
      <ChatNotice variant="informative">운행이 종료됐어요</ChatNotice>
    </div>
  ),
};
