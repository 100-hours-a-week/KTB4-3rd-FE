import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import {
  TransferConfirmationRecognitionFailedDialog,
  UnsettledSettlementDialog,
} from '@/features/taxi-pot-settlement';

type DialogStoryProps = { variant: 'recognitionFailed' | 'unsettled' };

function DialogStory({ variant }: DialogStoryProps) {
  const [open, setOpen] = useState(true);

  return variant === 'recognitionFailed' ? (
    <TransferConfirmationRecognitionFailedDialog onOpenChange={setOpen} open={open} />
  ) : (
    <UnsettledSettlementDialog onOpenChange={setOpen} open={open} />
  );
}

const meta = {
  title: 'Features/TaxiPotSettlement/TransferConfirmationDialogs',
  component: TransferConfirmationRecognitionFailedDialog,
  parameters: { layout: 'fullscreen' },
  args: { open: true },
} satisfies Meta<typeof TransferConfirmationRecognitionFailedDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RecognitionFailed: Story = {
  render: () => <DialogStory variant="recognitionFailed" />,
};

export const Unsettled: Story = {
  render: () => <DialogStory variant="unsettled" />,
};
