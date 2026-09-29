import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { LocationSearchHeader } from './location-search-header';

const meta = {
  title: 'Features/PostLocation/LocationSearchHeader',
  component: LocationSearchHeader,
  parameters: {
    layout: 'centered',
  },
  args: {
    backHref: '/',
    className: 'w-[353px]',
  },
} satisfies Meta<typeof LocationSearchHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
