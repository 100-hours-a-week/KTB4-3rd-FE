import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ChatListTabs } from '@/entities/chat';

const meta = {
  title: 'Entities/Chat/ChatListTabs',
  component: ChatListTabs,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ChatListTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CommunitySelected: Story = {
  args: {
    defaultValue: 'community',
  },
};

export const MatchingSelected: Story = {
  args: {
    defaultValue: 'matching',
  },
};
