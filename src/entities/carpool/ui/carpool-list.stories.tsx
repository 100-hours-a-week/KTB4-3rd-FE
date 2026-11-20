import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { CarPoolList, type CarPoolListItem, type CarPoolListProps } from '@/entities/carpool';

const item: CarPoolListItem = {
  id: 10,
  host: { name: '홍길동', profile_image_url: null },
  origin_name: '판교역',
  dest_name: '유스페이스1',
  departure_at: '2026-10-10T09:40:00Z',
  distance_m: 100,
  current_count: 2,
  capacity: 4,
  is_full: false,
  is_expired: false,
};
const items: CarPoolListItem[] = [
  item,
  {
    ...item,
    id: 11,
    origin_name: '아주 긴 출발지 이름 판교테크노밸리 A동 정문',
    dest_name: '아주 긴 도착지 이름 강남역 12번 출구',
    current_count: 1,
    capacity: 3,
  },
  { ...item, id: 12, current_count: 4, is_full: true },
  { ...item, id: 13, is_expired: true },
];

function Preview(props: CarPoolListProps) {
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const listProps = props.status === 'content' ? { ...props, scrollRoot } : props;
  return (
    <div
      className="h-[350px] w-[393px] max-w-[calc(100vw-32px)] overflow-y-auto bg-[var(--color-bg-layer-default)]"
      ref={setScrollRoot}
    >
      <CarPoolList {...listProps} />
    </div>
  );
}
const meta = {
  title: 'Entities/Carpool/CarPoolList',
  component: CarPoolList,
  parameters: { layout: 'centered' },
  render: (args) => <Preview {...args} />,
  args: {
    status: 'content',
    items,
    hasNextPage: true,
    isLoadingMore: false,
    canLoadMore: true,
    scrollRoot: null,
    onCarpoolClick: fn(),
    onLoadMore: fn(),
  },
} satisfies Meta<typeof CarPoolList>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Content: Story = {};
export const Loading: Story = { args: { status: 'loading' } };
export const Empty: Story = { args: { status: 'empty' } };
export const Error: Story = {
  args: { status: 'error', errorMessage: '네트워크 연결을 확인해주세요.', onRetry: fn() },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: '다시 불러오기' }));
    if (args.status === 'error') {
      await expect(args.onRetry).toHaveBeenCalledOnce();
    }
  },
};
export const LoadingMore: Story = { args: { isLoadingMore: true } };
export const LoadMoreError: Story = { args: { loadMoreError: true, canLoadMore: true } };
export const LastPage: Story = { args: { hasNextPage: false } };
export const Paused: Story = { args: { canLoadMore: false } };
