import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { CongestionPinSelect } from './congestion-pin-select';

const meta = {
  title: 'Features/Congestion/CongestionPinSelect',
  component: CongestionPinSelect,
  args: {
    'aria-label': '지연 혼잡도 핀',
    variant: 'delayed',
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CongestionPinSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};

export const Selected: Story = {
  args: {
    defaultSelected: true,
  },
};
