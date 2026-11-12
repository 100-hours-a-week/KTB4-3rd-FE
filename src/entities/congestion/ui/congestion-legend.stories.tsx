import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { CongestionLegend, type CongestionLegendItem } from './congestion-legend';

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

const congestionItems: readonly CongestionLegendItem[] = [
  { color: '#CCE9FF', label: '여유' },
  { color: '#FBDC65', label: '다소 혼잡' },
  { color: '#FA342C', label: '매우 혼잡' },
  { color: '#FA9D2C', label: '지연' },
  { color: '#111111', label: '사고' },
];

export const Congestion: Story = {
  args: {
    heading: '혼잡도',
    items: congestionItems,
  },
};
