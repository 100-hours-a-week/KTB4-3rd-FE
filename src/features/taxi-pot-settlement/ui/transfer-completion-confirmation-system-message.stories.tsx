import type { Meta } from '@storybook/nextjs-vite';

import { TransferCompletionConfirmationSystemMessage } from '@/features/taxi-pot-settlement';

const decorators: NonNullable<Meta['decorators']> = [
  (Story) => (
    <div className="w-[393px] max-w-screen bg-[var(--color-bg-layer-fill)] p-5">
      <Story />
    </div>
  ),
];

export default {
  title: 'Features/TaxiPotSettlement/TransferCompletionConfirmationSystemMessage',
  parameters: { layout: 'centered' },
  decorators,
};

export const TransferCompletionConfirmation = {
  render: () => <TransferCompletionConfirmationSystemMessage onAcknowledge={() => {}} />,
};

export const TransferUnverified = {
  render: () => (
    <TransferCompletionConfirmationSystemMessage
      description="송금 확인이 어려우면 대면으로 내역 확인 후 버튼을 눌러주세요."
      onAcknowledge={() => {}}
    />
  ),
};
