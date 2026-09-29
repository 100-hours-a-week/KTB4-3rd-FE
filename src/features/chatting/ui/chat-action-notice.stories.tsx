import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ChatActionNotice } from '@/features/chatting';

const meta = {
  title: 'Features/Chatting/ChatActionNotice',
  component: ChatActionNotice,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="bg-[var(--color-bg-layer-fill)] p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatActionNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    actionLabel: '확인',
    children: '운행이 시작됐나요?',
  },
};

export const LongMessage: Story = {
  args: {
    actionLabel: '확인',
    children: '운행이 시작되었는지 확인해 주세요. 준비가 되었다면 확인을 눌러 주세요.',
  },
};

export const Disabled: Story = {
  args: {
    actionLabel: '확인',
    actionProps: { disabled: true },
    children: '운행이 시작됐나요?',
  },
};
