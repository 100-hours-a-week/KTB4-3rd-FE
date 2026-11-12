import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { TransferConfirmationAnalysisDialog } from '@/features/taxi-pot-settlement';

function AnalysisDialogStory() {
  const [open, setOpen] = useState(true);

  return <TransferConfirmationAnalysisDialog onOpenChange={setOpen} open={open} />;
}

const meta = {
  title: 'Features/TaxiPotSettlement/TransferConfirmationAnalysisDialog',
  component: TransferConfirmationAnalysisDialog,
  parameters: { layout: 'fullscreen' },
  args: { open: true },
  render: () => <AnalysisDialogStory />,
} satisfies Meta<typeof TransferConfirmationAnalysisDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Analyzing: Story = {};
