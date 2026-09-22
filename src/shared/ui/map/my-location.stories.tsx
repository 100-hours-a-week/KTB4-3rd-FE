import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { MyLocation, MyLocationButton } from './my-location';

const meta = {
  title: 'Shared/Map/MyLocation',
  component: MyLocation,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MyLocation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Marker: Story = {};

export const Button: Story = {
  render: () => <MyLocationButton />,
};
