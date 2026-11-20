import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { LoadingDots } from '@/shared/ui/loading-dots';

const meta = {
  title: 'Shared/LoadingDots',
  component: LoadingDots,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="rounded-[12px] bg-[var(--color-bg-brand-weak)] p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LoadingDots>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
