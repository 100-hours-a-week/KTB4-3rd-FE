import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import {
  TaxiMeterAnalysisDialog,
  type TaxiMeterAnalysisDialogProps,
} from '@/features/taxi-pot-settlement';

function AnalysisDialogStory({ delayed }: Pick<TaxiMeterAnalysisDialogProps, 'delayed'>) {
  const [open, setOpen] = useState(true);

  return <TaxiMeterAnalysisDialog delayed={delayed} onOpenChange={setOpen} open={open} />;
}

const meta = {
  title: 'Features/TaxiPotSettlement/TaxiMeterAnalysisDialog',
  component: TaxiMeterAnalysisDialog,
  parameters: { layout: 'fullscreen' },
  args: { open: true },
  render: (args) => <AnalysisDialogStory delayed={args.delayed} />,
} satisfies Meta<typeof TaxiMeterAnalysisDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Analyzing: Story = {};

export const Delayed: Story = {
  args: { delayed: true },
};
