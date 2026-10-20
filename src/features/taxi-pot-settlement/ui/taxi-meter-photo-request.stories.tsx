import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { userEvent, within } from 'storybook/test';

import { TaxiMeterPhotoConfirmation, TaxiMeterPhotoRequest } from '@/features/taxi-pot-settlement';

const meta = {
  title: 'Features/TaxiPotSettlement/TaxiMeterPhotoRequest',
  component: TaxiMeterPhotoRequest,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[393px] max-w-screen bg-[var(--color-bg-layer-fill)] p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TaxiMeterPhotoRequest>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Request: Story = {
  args: {
    onSend: () => {},
  },
};

export const PhotoConfirmation: Story = {
  args: {
    onSend: () => {},
  },
  render: () => (
    <TaxiMeterPhotoConfirmation
      onBack={() => {}}
      onRetake={() => {}}
      onSend={() => {}}
      previewUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='220' viewBox='0 0 320 220'%3E%3Crect width='320' height='220' rx='20' fill='%232e333b'/%3E%3Crect x='35' y='42' width='250' height='110' rx='10' fill='%23161c23'/%3E%3Ctext x='160' y='116' text-anchor='middle' font-family='sans-serif' font-size='50' fill='%23f9fbff'%3E12,400%3C/text%3E%3Ctext x='160' y='185' text-anchor='middle' font-family='sans-serif' font-size='21' fill='%23f9fbff'%3E%ED%83%9D%EC%8B%9C%20%EB%AF%B8%ED%84%B0%EA%B8%B0%3C/text%3E%3C/svg%3E"
    />
  ),
};

export const ExitConfirmation: Story = {
  ...PhotoConfirmation,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: '사진 확인 닫기' }));
  },
};
