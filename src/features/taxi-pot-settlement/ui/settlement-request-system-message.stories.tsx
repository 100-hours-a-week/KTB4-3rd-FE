import type { Meta } from '@storybook/nextjs-vite';

import { TaxiPotSettlementRequestSystemMessage } from '@/features/taxi-pot-settlement';

const meta = {
  title: 'Features/TaxiPotSettlement/SettlementRequestSystemMessage',
  component: TaxiPotSettlementRequestSystemMessage,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[393px] max-w-screen bg-[var(--color-bg-layer-fill)] p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TaxiPotSettlementRequestSystemMessage>;

export default meta;

export const Host = {
  render: () => (
    <TaxiPotSettlementRequestSystemMessage
      bankAccount="카카오뱅크 000-0000-0000"
      onBankAccountClick={() => {}}
      perPersonAmount={13000}
      role="host"
    />
  ),
};

export const Passenger = {
  render: () => (
    <TaxiPotSettlementRequestSystemMessage
      bankAccount="카카오뱅크 000-0000-0000"
      onBankAccountClick={() => {}}
      onViewMeterPhoto={() => {}}
      perPersonAmount={13000}
      role="passenger"
      totalAmount={26000}
    />
  ),
};
