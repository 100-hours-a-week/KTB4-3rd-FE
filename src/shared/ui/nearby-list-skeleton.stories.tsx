import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { NearbyListSkeleton } from './nearby-list-skeleton';

const meta = {
  title: 'Shared/NearbyListSkeleton',
  component: NearbyListSkeleton,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[393px] max-w-[calc(100vw-32px)]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NearbyListSkeleton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Carpool: Story = { args: { label: '주변 카풀을 불러오는 중' } };
