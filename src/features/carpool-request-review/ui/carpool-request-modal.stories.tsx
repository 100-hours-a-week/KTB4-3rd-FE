import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { CarpoolRequestModal } from './carpool-request-modal';

const request = {
  id: 41,
  carpool_id: 12,
  status: 'PENDING',
  requester: {
    id: 8,
    name: '김모여',
    profile_image_url: null,
  },
  content: '안녕하세요! 판교역에서 같이 이동하고 싶어요. 시간 맞춰서 갈 수 있습니다.',
  created_at: '2026-09-06T21:10:00.000Z',
} as const;

const meta = {
  title: 'Features/CarpoolRequestReview/CarpoolRequestModal',
  component: CarpoolRequestModal,
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    status: 'content',
    request,
    processingAction: null,
    canAccept: true,
    canReject: true,
    onClose: () => {},
    onAccept: () => {},
    onReject: () => {},
  },
} satisfies Meta<typeof CarpoolRequestModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Content: Story = {};

export const Loading: Story = {
  args: { open: true, status: 'loading', onClose: () => {} },
};

export const Error: Story = {
  args: {
    open: true,
    status: 'error',
    errorMessage: '요청 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
    onRetry: () => {},
    onClose: () => {},
  },
};

export const Accepting: Story = {
  args: { ...meta.args, processingAction: 'accept' },
};
