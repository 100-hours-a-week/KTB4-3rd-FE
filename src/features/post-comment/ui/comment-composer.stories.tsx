import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { CommentComposer } from './comment-composer';

const meta = {
  title: 'Features/PostComment/CommentComposer',
  component: CommentComposer,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[393px] shadow-[0_0_10px_rgba(0,0,0,0.08)]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CommentComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithComment: Story = {
  args: {
    defaultValue: '댓글을 입력해 주세요.',
  },
};

export const AtCharacterLimit: Story = {
  args: {
    defaultValue: '가'.repeat(280),
  },
};

export const OverCharacterLimit: Story = {
  args: {
    defaultValue: '가'.repeat(281),
  },
};
