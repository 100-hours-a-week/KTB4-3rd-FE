import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { ChatReportDialog, type ChatReportDialogSubmitPayload } from '@/features/chatting';
import { Button } from '@/shared/ui/button';

const meta = {
  title: 'Features/Chatting/ChatReportDialog',
  component: ChatReportDialog,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    defaultOpen: true,
  },
} satisfies Meta<typeof ChatReportDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OtherReason: Story = {
  args: {
    defaultReason: 'other',
    defaultDescription: '신고 내용을 입력해주세요.',
  },
};

function ControlledStory() {
  const [open, setOpen] = useState(true);
  const [lastSubmission, setLastSubmission] = useState<ChatReportDialogSubmitPayload>();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--color-bg-layer-fill)] p-5">
      <Button onClick={() => setOpen(true)}>신고 Dialog 열기</Button>
      {lastSubmission ? (
        <pre className="max-w-full text-sm whitespace-pre-wrap">
          {JSON.stringify(lastSubmission, null, 2)}
        </pre>
      ) : null}
      <ChatReportDialog onOpenChange={setOpen} onSubmit={setLastSubmission} open={open} />
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledStory />,
  args: {},
};
