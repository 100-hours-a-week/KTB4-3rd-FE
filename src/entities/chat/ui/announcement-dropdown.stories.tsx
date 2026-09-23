import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { AnnouncementDropdown } from '@/entities/chat';

const meta = {
  title: 'Entities/Chat/AnnouncementDropdown',
  component: AnnouncementDropdown,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[393px] bg-[var(--color-bg-layer-fill)] p-3">
        <Story />
      </div>
    ),
  ],
  args: {
    departureTime: '18:40',
  },
} satisfies Meta<typeof AnnouncementDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {};

export const Expanded: Story = {
  args: {
    defaultExpanded: true,
  },
};
