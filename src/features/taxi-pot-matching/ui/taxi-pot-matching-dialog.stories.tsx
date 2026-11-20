import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { TaxiPotMatchingDialog } from './taxi-pot-matching-dialog';

function TaxiPotMatchingDialogStory() {
  const [open, setOpen] = useState(true);

  return (
    <TaxiPotMatchingDialog
      open={open}
      onConfirm={() => setOpen(false)}
      onCancel={(event) => event.preventDefault()}
    />
  );
}

const meta = {
  title: 'Features/TaxiPotMatching/TaxiPotMatchingDialog',
  component: TaxiPotMatchingDialog,
  parameters: { layout: 'fullscreen' },
  args: { open: true },
  render: () => <TaxiPotMatchingDialogStory />,
} satisfies Meta<typeof TaxiPotMatchingDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Matching: Story = {};
