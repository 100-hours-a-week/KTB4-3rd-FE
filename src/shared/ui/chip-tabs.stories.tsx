import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ChipTabs } from './chip-tabs';

const options = [
  { label: '전체', value: 'all', widthClassName: 'w-[68px]' },
  { label: '안읽음', value: 'unread', widthClassName: 'w-[80px]' },
] as const;

const meta = {
  title: 'Shared/ChipTabs',
  component: ChipTabs,
  args: {
    ariaLabel: '알림 필터',
    options,
    value: 'all',
    onValueChange: () => undefined,
  },
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ChipTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllSelected: Story = {};

export const UnreadSelected: Story = {
  args: { value: 'unread' },
};
