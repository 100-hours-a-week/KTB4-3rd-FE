import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { Button } from './button';
import { Dialog } from './dialog';

const meta = {
  title: 'Shared/Dialog',
  component: Dialog,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    defaultOpen: true,
    title: '만족도를 입력해주세요.',
    description: '동승자에 대한 만족도를 입력해주세요.',
    children: <DialogBody />,
    buttons: 'primary',
  },
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

function DialogBody({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, index) => (
        <div className="rounded-xl bg-[var(--color-bg-layer-fill)] p-4" key={index}>
          <div className="flex items-center justify-between gap-3">
            <span>동승자 {index + 1}</span>
            <span className="text-xs text-[var(--color-fg-neutral-muted)]">신고하기 &gt;</span>
          </div>
          <div className="mt-3 h-12 rounded-lg bg-[var(--color-bg-neutral-weak)]" />
        </div>
      ))}
    </div>
  );
}

export const PrimaryOnly: Story = {};

export const PrimaryAndSecondary: Story = {
  args: {
    buttons: 'primarySecondary',
  },
};

export const NoChildren: Story = {
  args: {
    children: undefined,
    description: undefined,
  },
};

export const LongContent: Story = {
  args: {
    title: '긴 본문을 확인해주세요.',
    description: '헤더와 버튼은 고정되고 본문만 스크롤됩니다.',
    children: <DialogBody count={12} />,
  },
};

export const BackdropDismissDisabled: Story = {
  args: {
    closeOnBackdropClick: false,
    description: 'Backdrop을 눌러도 닫히지 않는 Dialog입니다.',
  },
};

function ControlledStory() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-[var(--color-bg-layer-fill)] p-5">
      <Button onClick={() => setOpen(true)}>Dialog 열기</Button>
      <Dialog
        buttons="primarySecondary"
        description="ESC, backdrop, 닫기 버튼으로 닫을 수 있습니다."
        onOpenChange={setOpen}
        open={open}
        title="제어되는 Dialog"
      >
        <DialogBody count={8} />
      </Dialog>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledStory />,
  args: {},
};
