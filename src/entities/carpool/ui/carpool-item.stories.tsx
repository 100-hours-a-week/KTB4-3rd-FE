import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { CarpoolItem, type CarPoolListItem } from '@/entities/carpool';

const carpool: CarPoolListItem = {
  id: 10,
  host: { name: '홍길동', profile_image_url: null },
  origin_name: '판교역',
  dest_name: '유스페이스1',
  departure_at: '2026-10-10T09:40:00.000Z',
  distance_m: 320,
  current_count: 2,
  capacity: 4,
  is_full: false,
  is_expired: false,
};

const meta = {
  title: 'Entities/Carpool/CarpoolItem',
  component: CarpoolItem,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <ul className="m-0 w-[393px] max-w-[calc(100vw-32px)] list-none bg-[var(--color-bg-layer-default)] p-0">
        <Story />
      </ul>
    ),
  ],
  args: { carpool, onClick: fn(), showDivider: true },
} satisfies Meta<typeof CarpoolItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
    await expect(args.onClick).toHaveBeenCalledWith(carpool.id);
  },
};

export const LongPlaces: Story = {
  args: {
    carpool: {
      ...carpool,
      origin_name: '아주 긴 출발지 이름 판교테크노밸리 유스페이스1 A동 정문',
      dest_name: '아주 긴 도착지 이름 서울 강남역 12번 출구',
    },
  },
};

export const Full: Story = {
  args: { carpool: { ...carpool, current_count: 4, is_full: true } },
};

export const Expired: Story = {
  args: { carpool: { ...carpool, departure_at: '2026-01-01T09:40:00.000Z', is_expired: true } },
};

export const ImageUnavailable: Story = {
  args: {
    carpool: { ...carpool, host: { name: '홍길동', profile_image_url: '/missing-profile.png' } },
  },
};
