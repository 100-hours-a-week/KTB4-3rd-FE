import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { BottomModal } from './bottom-modal';
import { Dialog } from './dialog';

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

function ScrollableModalContent() {
  return (
    <div className="space-y-6 p-6">
      <ModalContent />
      {Array.from({ length: 6 }, (_, index) => (
        <p
          className="leading-[var(--line-height-t4)] text-[var(--color-fg-neutral-muted)] text-[var(--font-size-t4)]"
          key={index}
        >
          스크롤할 수 있는 바텀모달 콘텐츠입니다. 헤더 액션은 스크롤 중에도 상단에 유지되어야
          합니다.
        </p>
      ))}
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
  name: '부모에서 열림 여부 관리',
  args: {
    children: <ModalContent />,
    href: '/posts/1',
  },
  render: () => <ControlledStory />,
};

export const Scrollable: Story = {
  args: {
    children: <ScrollableModalContent />,
    href: '/posts/1',
  },
  render: (args) => (
    <div className="min-h-dvh bg-[var(--color-bg-layer-fill)]">
      <BottomModal {...args} />
    </div>
  ),
};

export const WithoutExpand: Story = {
  name: '크게보기 없이 사용',
  args: { href: undefined, showExpand: false, children: <ModalContent /> },
};

export const CloseDisabled: Story = {
  name: '닫기 차단',
  args: { href: undefined, showExpand: false, closeDisabled: true, children: <ModalContent /> },
};

function FocusFlowStory() {
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [message, setMessage] = useState('작성한 내용은 확인 취소 시 유지됩니다.');
  return (
    <div className="min-h-dvh bg-[var(--color-bg-layer-fill)] p-5">
      <button type="button" onClick={() => setOpen(true)}>
        모달 열기
      </button>
      <BottomModal
        open={open}
        showExpand={false}
        closeDisabled={locked || confirmation}
        onOpenChange={setOpen}
        bottomOffset="calc(72px + env(safe-area-inset-bottom, 0px))"
      >
        <div className="space-y-5 p-5">
          <h2>키보드와 닫기 동작 확인</h2>
          <label className="flex flex-col gap-2">
            메시지
            <textarea
              className="min-h-24 rounded-lg border p-3"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={locked}
              onChange={(event) => setLocked(event.target.checked)}
            />
            닫기 차단
          </label>
          <button type="button" onClick={() => setConfirmation(true)}>
            내용 삭제 확인
          </button>
          <p role="status">{locked ? '닫기 차단 중' : '닫기 허용'}</p>
          <Dialog
            open={confirmation}
            onOpenChange={setConfirmation}
            title="내용을 삭제할까요?"
            description="계속 작성하거나 Escape를 누르면 기존 내용이 유지됩니다."
            buttons="primarySecondary"
            primaryLabel="삭제"
            secondaryLabel="계속 작성"
            primaryButtonProps={{ onClick: () => setMessage('') }}
          />
        </div>
      </BottomModal>
    </div>
  );
}

export const FocusFlow: Story = {
  name: '키보드·닫기 잠금·확인 창',
  render: () => <FocusFlowStory />,
};
