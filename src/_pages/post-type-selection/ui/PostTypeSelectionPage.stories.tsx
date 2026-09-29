import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PostTypeSelectionPage } from '@/_pages/post-type-selection';

const meta = {
  title: 'Pages/PostTypeSelectionPage',
  component: PostTypeSelectionPage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PostTypeSelectionPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
