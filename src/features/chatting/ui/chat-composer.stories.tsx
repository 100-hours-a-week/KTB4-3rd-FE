import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { ChatComposer } from '@/features/chatting';

const meta = {
  title: 'Features/Chatting/ChatComposer',
  component: ChatComposer,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[393px] shadow-[0_0_10px_rgba(0,0,0,0.08)]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithMessage: Story = {
  args: {
    defaultValue: '안녕하세요!',
  },
};

function ControlledChatComposer() {
  const [value, setValue] = useState('');

  return (
    <ChatComposer
      onSubmit={(message) => setValue(`전송됨: ${message}`)}
      onValueChange={setValue}
      value={value}
    />
  );
}

export const Controlled: Story = {
  render: () => <ControlledChatComposer />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
