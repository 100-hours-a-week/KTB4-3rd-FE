import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { MapPin } from './map-pin';

const meta = {
  title: 'Entities/MapPin',
  component: MapPin,
  parameters: {
    layout: 'centered',
  },
  args: {
    variant: 'accompany',
  },
} satisfies Meta<typeof MapPin>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Accompany: Story = {};

export const Community: Story = {
  args: {
    variant: 'community',
  },
};

export const Start: Story = {
  args: {
    variant: 'start',
  },
};

export const Destination: Story = {
  args: {
    variant: 'destination',
  },
};

export const Clicked: Story = {
  args: {
    state: 'clicked',
    variant: 'community',
  },
};

export const All: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      <MapPin variant="accompany" />
      <MapPin variant="community" />
      <MapPin variant="start" />
      <MapPin variant="destination" />
    </div>
  ),
};
