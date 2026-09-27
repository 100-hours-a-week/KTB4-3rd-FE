import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ChatLeaveDialog } from './chat-leave-dialog';

const meta = {
  title: 'Features/Chatting/ChatLeaveDialog',
  component: ChatLeaveDialog,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    defaultOpen: true,
  },
} satisfies Meta<typeof ChatLeaveDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
