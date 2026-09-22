import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { LocationSelectionFooter } from './location-selection-footer';

const meta = {
  title: 'Features/PostLocation/LocationSelectionFooter',
  component: LocationSelectionFooter,
  parameters: {
    layout: 'centered',
  },
  args: {
    className: 'w-[393px]',
  },
} satisfies Meta<typeof LocationSelectionFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
