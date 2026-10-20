import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import {
  TaxiMeterAmountDialog,
  type TaxiMeterAmountDialogProps,
} from '@/features/taxi-pot-settlement';

function AmountDialogStory({
  recognitionFailed,
}: Pick<TaxiMeterAmountDialogProps, 'recognitionFailed'>) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(true);

  return (
    <TaxiMeterAmountDialog
      onValueChange={setValue}
      onOpenChange={setOpen}
      open={open}
      recognitionFailed={recognitionFailed}
      value={value}
    />
  );
}

const meta = {
  title: 'Features/TaxiPotSettlement/TaxiMeterAmountDialog',
  component: TaxiMeterAmountDialog,
  parameters: { layout: 'fullscreen' },
  args: { open: true, value: '', onValueChange: () => {} },
  render: (args) => <AmountDialogStory recognitionFailed={args.recognitionFailed} />,
} satisfies Meta<typeof TaxiMeterAmountDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DirectEntry: Story = {};

export const RecognitionFailed: Story = {
  args: { recognitionFailed: true },
};
