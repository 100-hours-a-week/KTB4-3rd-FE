import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BottomActionButton } from './bottom-action-button';

const meta = {
  title: 'Shared/BottomActionButton',
  component: BottomActionButton,
  parameters: {
    layout: 'centered',
  },
  args: {
    children: '다음',
    className: 'w-[353px]',
  },
} satisfies Meta<typeof BottomActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
