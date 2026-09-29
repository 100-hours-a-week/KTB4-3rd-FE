import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TaxiPotRideActionNotice } from '@/features/taxi-pot-chat';

const meta = {
  title: 'Features/TaxiPotChat/TaxiPotRideActionNotice',
  component: TaxiPotRideActionNotice,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="bg-[var(--color-bg-layer-fill)] p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TaxiPotRideActionNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Start: Story = {
  args: {
    action: 'start',
    onConfirm: () => undefined,
  },
};

export const End: Story = {
  args: {
    action: 'end',
    onConfirm: () => undefined,
  },
};

export const Loading: Story = {
  args: {
    action: 'start',
    loading: true,
    onConfirm: () => undefined,
  },
};
