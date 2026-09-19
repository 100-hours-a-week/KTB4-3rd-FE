import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { HStack, VStack } from './stack';
import { Divider } from './divider';

const meta = {
  title: 'Shared/Divider',
  component: Divider,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <VStack gap="dimension-x4">
      <div>첫 번째 콘텐츠</div>
      <Divider />
      <div>두 번째 콘텐츠</div>
    </VStack>
  ),
};

export const Subtle: Story = {
  render: () => (
    <VStack gap="dimension-x4">
      <div>첫 번째 콘텐츠</div>
      <Divider color="neutral-subtle" inset />
      <div>두 번째 콘텐츠</div>
    </VStack>
  ),
};

export const Vertical: Story = {
  render: () => (
    <HStack className="h-16" gap="dimension-x4" align="center">
      <div>첫 번째 콘텐츠</div>
      <Divider orientation="vertical" />
      <div>두 번째 콘텐츠</div>
    </HStack>
  ),
};
