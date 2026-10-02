import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { CharacterCount } from './character-count';

const meta = {
  title: 'Shared/CharacterCount',
  component: CharacterCount,
  args: {
    characterCount: 8,
    maxCharacterCount: 10,
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CharacterCount>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    characterCount: 0,
  },
};

export const AtCharacterLimit: Story = {
  args: {
    characterCount: 10,
  },
};

export const OverCharacterLimit: Story = {
  args: {
    characterCount: 11,
  },
};
