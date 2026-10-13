import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { userEvent, within } from 'storybook/test';

import { TaxiMeterPhotoConfirmation, TransferPhotoRequest } from '@/features/taxi-pot-settlement';

const meta = {
  title: 'Features/TaxiPotSettlement/TransferPhotoRequest',
  component: TransferPhotoRequest,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[393px] max-w-screen bg-[var(--color-bg-layer-fill)] p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TransferPhotoRequest>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AttachmentRequest: Story = {
  args: { onSend: () => {} },
};

export const PhotoPreview: Story = {
  args: { onSend: () => {} },
  render: () => (
    <TaxiMeterPhotoConfirmation
      onBack={() => {}}
      onRetake={() => {}}
      onSend={() => {}}
      photoAlt="선택한 송금 사진"
      previewUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='220' viewBox='0 0 320 220'%3E%3Crect width='320' height='220' rx='20' fill='%232e333b'/%3E%3Crect x='35' y='42' width='250' height='110' rx='10' fill='%23161c23'/%3E%3Ctext x='160' y='116' text-anchor='middle' font-family='sans-serif' font-size='28' fill='%23f9fbff'%3E송금 완료%3C/text%3E%3C/svg%3E"
      retakeLabel="다시 선택하기"
      screenLabel="송금 사진 확인 화면"
    />
  ),
};

export const RetakeWarning: Story = {
  ...PhotoPreview,
  play: async () => {
    await userEvent.click(within(document.body).getByRole('button', { name: '다시 선택하기' }));
    await within(document.body).findByText('정말 나가시겠어요?');
  },
};
