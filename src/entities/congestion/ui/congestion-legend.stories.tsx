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
  { color: '#CCE9FF', label: '원활·여유', range: '0~40' },
  { color: '#FBDC65', label: '혼잡', range: '41~70' },
  { color: '#FA342C', label: '붐빔·만석', range: '71~100' },
  { color: '#FA9D2C', label: '지연', range: '5분 이상' },
  { color: '#111111', label: '사고', range: '다중 제보' },
];

export const Congestion: Story = {
  args: {
    heading: '혼잡도',
    items: congestionItems,
  },
};
