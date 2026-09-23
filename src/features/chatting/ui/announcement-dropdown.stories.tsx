import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { AnnouncementDropdown } from '@/features/chatting';

const meta = {
  title: 'Features/Chatting/AnnouncementDropdown',
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

export const ExpandedOverlay: Story = {
  args: {
    defaultExpanded: true,
  },
  render: (args) => (
    <div className="flex flex-col gap-3">
      <AnnouncementDropdown {...args} />
      <div className="h-20 rounded-[12px] bg-[var(--color-bg-layer-default)] p-4 text-[var(--color-fg-neutral)]">
        다음 콘텐츠 영역
      </div>
    </div>
  ),
};
