import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { CongestionToggle, congestionToggleValues } from './congestion-toggle';

const meta = {
  title: 'Features/Congestion/CongestionToggle',
  component: CongestionToggle,
  args: {
    defaultValue: 'congestion',
  },
  argTypes: {
    defaultValue: {
      control: 'inline-radio',
      options: congestionToggleValues,
    },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CongestionToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CongestionSelected: Story = {};

export const CommunitySelected: Story = {
  args: {
    defaultValue: 'community',
  },
};

export const DesignStates: Story = {
  render: () => (
    <div className="flex flex-col gap-[19px]">
      <CongestionToggle defaultValue="congestion" />
      <CongestionToggle defaultValue="community" />
    </div>
  ),
};
