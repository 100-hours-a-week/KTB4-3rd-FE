import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Button } from './button';

const meta = {
  title: 'Shared/Button',
  component: Button,
  args: {
    children: '버튼',
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
  },
};
