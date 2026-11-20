import type { Meta } from '@storybook/nextjs-vite';

import { TransferCompletionSystemMessage } from '@/features/taxi-pot-settlement';

const decorators: NonNullable<Meta['decorators']> = [
  (Story) => (
    <div className="w-[393px] max-w-screen bg-[var(--color-bg-layer-fill)] p-5">
      <Story />
    </div>
  ),
];

export default {
  title: 'Features/TaxiPotSettlement/TransferCompletionSystemMessage',
  parameters: { layout: 'centered' },
  decorators,
};

export const TransferCompleted = {
  render: () => (
    <TransferCompletionSystemMessage amount={13000} nickname="애롱롱" onViewReceipt={() => {}} />
  ),
};
