import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { OwnedCarCard } from './owned-car-card';

const meta = {
  title: 'Features/OwnedCarManagement/OwnedCarCard',
  component: OwnedCarCard,
  args: {
    car: { id: 12, model: '아반떼', number: '12가3456' },
    onDelete: () => undefined,
    onEdit: () => undefined,
  },
} satisfies Meta<typeof OwnedCarCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};
