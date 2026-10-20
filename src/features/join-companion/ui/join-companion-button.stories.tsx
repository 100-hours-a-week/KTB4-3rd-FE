import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { JoinCompanionButton } from './join-companion-button';

const meta = {
  title: 'Features/JoinCompanionButton',
  component: JoinCompanionButton,
  decorators: [
    (Story) => (
      <div className="w-[312px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof JoinCompanionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Request: Story = { args: { label: '전송하기', type: 'submit' } };
export const Loading: Story = { args: { label: '전송하기', loading: true } };
export const Disabled: Story = { args: { disabled: true } };
