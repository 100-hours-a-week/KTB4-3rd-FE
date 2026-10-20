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
