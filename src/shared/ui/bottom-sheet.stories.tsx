import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';

import { BottomSheet } from './bottom-sheet';

const meta = {
  title: 'Shared/BottomSheet',
  component: BottomSheet,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BottomSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

const posts = [
  ['카풀', '판교역까지 카풀할 분 찾아요', '자차 · 18:40 출발 · 2/4명 참여 중'],
  ['택시', '판교역까지 택시 같이 탈 분 찾아요', '택시 · 0.8km · 1명 참여 중'],
  ['카풀', '신논현까지 카풀할 분 찾아요', '자차 · 1.2km · 3명 참여 중'],
  ['동행', '엑소 콘서트 같이 갈 분 찾아요', '지하철 · 1.5km · 5명 참여 중'],
];

function PostList({ count = posts.length }: { count?: number }) {
  return (
    <div className="w-full">
      {Array.from({ length: count }, (_, index) => {
        const [category, title, detail] = posts[index % posts.length];

        return (
          <button
            className="flex min-h-[72px] w-full items-center gap-3 border-b border-[var(--color-stroke-neutral-subtle)] px-4 py-3 text-left last:border-b-0"
            key={`${title}-${index}`}
            type="button"
          >
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-brand-solid)] leading-[var(--line-height-t3)] font-bold text-[var(--color-fg-neutral-inverted)] text-[var(--font-size-t3)]">
              {category}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate leading-[var(--line-height-t5)] text-[var(--color-fg-neutral)] text-[var(--font-size-t5)]">
                {title}
              </span>
              <span className="block truncate leading-[var(--line-height-t3)] text-[var(--color-fg-neutral-subtle)] text-[var(--font-size-t3)]">
                {detail}
              </span>
            </span>
            <span aria-hidden="true" className="text-xl text-[var(--color-fg-neutral-subtle)]">
              ›
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ControlledStory({ children, ...props }: ComponentProps<typeof BottomSheet>) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-[var(--color-bg-layer-fill)] p-5">
      <button
        className="rounded-lg bg-[var(--color-bg-neutral-solid)] px-4 py-3 text-sm font-bold text-white"
        onClick={() => setOpen(true)}
        type="button"
      >
        바텀시트 열기
      </button>
      <BottomSheet {...props} open={open} onOpenChange={setOpen}>
        {children}
      </BottomSheet>
    </div>
  );
}

export const InitialPartialOpen: Story = {
  args: {
    defaultOpen: true,
    title: '근처 핀 게시글',
    description: '가까운 순',
    children: <PostList count={4} />,
  },
};

export const Controlled: Story = {
  args: {
    title: '근처 핀 게시글',
    description: '가까운 순',
    children: <PostList count={4} />,
  },
  render: (args) => <ControlledStory {...args} />,
};

export const LongContent: Story = {
  args: {
    defaultOpen: true,
    title: '긴 콘텐츠',
    description: '시트 내부에서만 스크롤됩니다.',
    children: <PostList count={20} />,
  },
};

export const WithViewAll: Story = {
  args: {
    defaultOpen: true,
    title: '근처 핀 게시글',
    description: '가까운 순',
    showViewAllButton: true,
    onViewAll: () => undefined,
    children: <PostList count={4} />,
  },
};
