import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { CongestionLegend } from './congestion-legend';

const meta = {
  title: 'Entities/Congestion/CongestionLegend',
  component: CongestionLegend,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CongestionLegend>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
