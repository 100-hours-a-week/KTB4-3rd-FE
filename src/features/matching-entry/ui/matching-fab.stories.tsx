import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { MatchingFab, type MatchingFabProps } from './matching-fab';

const meta = {
  title: 'Features/Matching Entry/MatchingFab',
  component: MatchingFab,
  parameters: {
    layout: 'centered',
  },
  args: {
    isOpened: false,
    onOpenChange: () => undefined,
    onCarpoolClick: () => undefined,
    onTaxipotClick: () => undefined,
  },
} satisfies Meta<typeof MatchingFab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: {
    isOpened: false,
  },
};

export const Open: Story = {
  args: {
    isOpened: true,
  },
};

function ControlledPreview(props: MatchingFabProps) {
  const [isOpened, setIsOpened] = useState(props.isOpened);

  return (
    <div className="relative h-[240px] w-[240px] bg-[var(--color-bg-layer-fill)]">
      <MatchingFab
        {...props}
        className="absolute right-4 bottom-4"
        isOpened={isOpened}
        onOpenChange={setIsOpened}
      />
    </div>
  );
}

export const Controlled: Story = {
  render: (args) => <ControlledPreview {...args} />,
};
