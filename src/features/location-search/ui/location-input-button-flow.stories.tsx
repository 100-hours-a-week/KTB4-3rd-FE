import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { LocationInputButtonFlow } from './location-input-button-flow';

const meta = {
  title: 'Features/LocationSearch/LocationInputButtonFlow',
  component: LocationInputButtonFlow,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile2',
    },
  },
} satisfies Meta<typeof LocationInputButtonFlow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
