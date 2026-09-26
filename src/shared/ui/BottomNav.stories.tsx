import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BottomNav } from './BottomNav';

const meta = {
  title: 'Shared/BottomNav',
  component: BottomNav,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },
  },
} satisfies Meta<typeof BottomNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Home: Story = {};

export const Matching: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/matching',
      },
    },
  },
};

export const ChatRequest: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/chat/request',
      },
    },
  },
};

export const WithCustomClassName: Story = {
  args: {
    className: 'shadow-[0_0_0_2px_var(--color-fg-brand)]',
  },
};
