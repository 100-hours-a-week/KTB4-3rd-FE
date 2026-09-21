import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { BottomModal } from './bottom-modal';

const meta = {
  title: 'Shared/BottomModal',
  component: BottomModal,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    children: <ModalContent />,
    href: '/posts/1',
  },
} satisfies Meta<typeof BottomModal>;

export default meta;

type Story = StoryObj<typeof meta>;

function ModalContent() {
  return (
    <div className="p-6">
      <p className="mb-2 leading-[var(--line-height-t3)] font-bold text-[var(--color-fg-brand)] text-[var(--font-size-t3)]">
        동행 모집
      </p>
      <h2 className="m-0 leading-[var(--line-height-t6)] font-bold text-[var(--font-size-t6)]">
        판교역 → 유스페이스까지 차 ...
      </h2>
      <p className="mt-3 leading-[var(--line-height-t5)] text-[var(--color-fg-neutral-muted)] text-[var(--font-size-t5)]">
        택시 같이 타실 분 구해요!
      </p>
    </div>
  );
}

function ControlledStory() {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-dvh bg-[var(--color-bg-layer-fill)] p-5">
      <button
        className="rounded-lg bg-[var(--color-bg-brand-solid)] px-4 py-3 font-bold text-white"
        onClick={() => setOpen(true)}
        type="button"
      >
        바텀모달 열기
      </button>
      <BottomModal href="/posts/1" open={open} onOpenChange={setOpen}>
        <ModalContent />
      </BottomModal>
    </div>
  );
}

export const Default: Story = {
  args: {
    children: <ModalContent />,
    href: '/posts/1',
  },
  render: (args) => (
    <div className="min-h-dvh bg-[var(--color-bg-layer-fill)]">
      <BottomModal {...args} />
    </div>
  ),
};

export const Controlled: Story = {
  args: {
    children: <ModalContent />,
    href: '/posts/1',
  },
  render: () => <ControlledStory />,
};
