import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TaxiMeterAnalysisDialog } from '@/features/taxi-pot-settlement';

const meta = {
  title: 'Features/TaxiPotSettlement/TaxiMeterAnalysisDialog',
  component: TaxiMeterAnalysisDialog,
  parameters: { layout: 'fullscreen' },
  args: { open: true },
} satisfies Meta<typeof TaxiMeterAnalysisDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Analyzing: Story = {};

export const Delayed: Story = {
  args: { delayed: true },
};
