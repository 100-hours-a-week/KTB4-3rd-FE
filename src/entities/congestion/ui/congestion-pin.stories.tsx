import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { CongestionPin, congestionPinVariants } from './congestion-pin';

const meta = {
  title: 'Entities/Congestion/CongestionPin',
  component: CongestionPin,
  args: {
    variant: 'busy',
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: congestionPinVariants,
    },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CongestionPin>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Busy: Story = {};

export const Congested: Story = {
  args: {
    variant: 'congested',
  },
};

export const Available: Story = {
  args: {
    variant: 'available',
  },
};

export const Delayed: Story = {
  args: {
    variant: 'delayed',
  },
};

export const Accident: Story = {
  args: {
    variant: 'accident',
  },
};

export const All: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {congestionPinVariants.map((variant) => (
        <CongestionPin key={variant} variant={variant} />
      ))}
    </div>
  ),
};
