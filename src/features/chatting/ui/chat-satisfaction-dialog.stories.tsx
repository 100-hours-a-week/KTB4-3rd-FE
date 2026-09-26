import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import {
  ChatSatisfactionDialog,
  type ChatSatisfactionDialogSubmitPayload,
} from '@/features/chatting';
import { Button } from '@/shared/ui/button';

const meta = {
  title: 'Features/Chatting/ChatSatisfactionDialog',
  component: ChatSatisfactionDialog,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    defaultOpen: true,
  },
} satisfies Meta<typeof ChatSatisfactionDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

function ControlledStory() {
  const [open, setOpen] = useState(true);
  const [lastSubmission, setLastSubmission] = useState<ChatSatisfactionDialogSubmitPayload>();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--color-bg-layer-fill)] p-5">
      <Button onClick={() => setOpen(true)}>만족도 Dialog 열기</Button>
      {lastSubmission ? (
        <pre className="max-w-full text-sm whitespace-pre-wrap">
          {JSON.stringify(lastSubmission, null, 2)}
        </pre>
      ) : null}
      <ChatSatisfactionDialog onOpenChange={setOpen} onSubmit={setLastSubmission} open={open} />
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledStory />,
  args: {},
};
